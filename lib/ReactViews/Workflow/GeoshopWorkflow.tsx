import { action, runInAction } from "mobx";
import { observer } from "mobx-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import SelectableDimension from "../SelectableDimensions/SelectableDimension";
import { useViewState } from "../Context";
import { Panel } from "./Panel";
import WorkflowPanel from "./WorkflowPanel";
import TerriaError from "../../Core/TerriaError";
import styled, { useTheme } from "styled-components";
import Box from "../../Styled/Box";
import CloseButton from "../Generic/CloseButton";
import Text from "../../Styled/Text";
import Spacing from "../../Styled/Spacing";
import { createPortal } from "react-dom";
import { Button } from "../../Styled/Button";
import StyledButton from "../ActionBar/StyledButton";
import { ExternalLinkIcon } from "../Custom/ExternalLink";
import { PrefaceBox } from "../Generic/PrefaceBox";

type IAttributeCombinationDto = Array<ProductFormatAttributeCombinationDto[]>;

interface ProductFormatAttributeCombinationDto {
  attributeId: number;
  attributeName: string;
  valueId: number | null;
  value: string | null;
}

interface ICartItem {
  productFormatId: number;
  quantity: number;
  attributes: never[];
  dataDefinition?: Record<string, unknown>[];
}

export const GeoshopWorkflow: React.FC = observer(() => {
  const viewState = useViewState();
  const { terria } = viewState;
  const { t } = useTranslation();
  const productId = terria.geoshopCatalogItem?.productId;
  const productFormatIds = terria.geoshopCatalogItem?.productFormatIds;
  const [productFormatId, setProductFormatId] = useState(productFormatIds![0]);
  const attributesRef = useRef<
    {
      id: number;
      value: string;
      rawAttribute: ProductFormatAttributeCombinationDto[];
    }[]
  >([]);
  const attributeNameRef = useRef<string>();

  const [forceRender, setForceRender] = useState(0);
  const selectedAttributeCombinationIdRef = useRef<number>();
  const [description, setDescription] = useState<string | undefined>();
  const [name, setName] = useState<string | undefined>();
  const [productFormats, setProductFormats] = useState<any[]>([]);
  const [notification, setNotification] = useState<
    | {
        success: boolean;
        title: string;
        text: string;
        children: React.ReactNode;
      }
    | undefined
  >(undefined);

  const addedToCart = () => {
    if (notification?.success) {
      runInAction(() => {
        viewState.closeAttributeTable();
        terria.geoshopCatalogItem?.onRemoveFromWorkbench();
        terria.geoshopCatalogItem = undefined;
        terria.isWorkflowPanelActive = false;
      });
    }
    setNotification(undefined);
  };

  useEffect(() => {
    const fetchProductData = async () => {
      const productData: any = await (
        await fetch(
          `${terria.configParameters.geoshopConfig?.baseApiUrl}/product/${productId}`
        )
      ).json();
      if (!productData) {
        return;
      }

      setName(productData.name);
      setDescription(productData.description);
      setProductFormats(
        productData.productFormats.filter((format: any) =>
          productFormatIds?.includes(format.id)
        )
      );
    };

    fetchProductData();
  }, []);

  useEffect(() => {
    const fetchAttributes = async () => {
      try {
        const attributeCombinations: IAttributeCombinationDto = await (
          await fetch(
            `${terria.configParameters.geoshopConfig?.baseApiUrl}/ProductFormat/${productFormatId}/attributes`
          )
        ).json();

        if (
          attributeCombinations.length > 0 &&
          attributeCombinations[0].length > 0
        ) {
          selectedAttributeCombinationIdRef.current = 1;

          attributeNameRef.current = attributeCombinations[0]
            .sort((a, b) => a.attributeId - b.attributeId)
            .map((attribute) => attribute.attributeName)
            .join(", ");

          const processedAttributes = attributeCombinations.map(
            (attributeCombination, index) => {
              return {
                id: index + 1,
                value: attributeCombination
                  .sort((a, b) => a.attributeId - b.attributeId)
                  .map((attribute) => attribute.value ?? "-")
                  .join(", "),
                rawAttribute: attributeCombination
              };
            }
          );

          attributesRef.current = processedAttributes;
        } else {
          selectedAttributeCombinationIdRef.current = 1;
          attributeNameRef.current = undefined;
          attributesRef.current = [];
        }
        setForceRender(forceRender + 1);
      } catch (error) {
        throw new TerriaError({
          title: "Error",
          message: "An error occurred while fetching attributes.",
          overrideRaiseToUser: true
        });
      }
    };

    fetchAttributes();
  }, [productFormatId]);

  const addToCart = async () => {
    const dataDefinition =
      terria.geoshopCatalogItem?.highlightItem?.selectedItemsProperties.map(
        (item) => {
          const data: Record<string, any> = {};
          terria.geoshopCatalogItem?.dataUniqueIdentifiers?.forEach(
            (identifier) => {
              data[identifier] = item.properties?.[identifier];
            }
          );
          terria.geoshopCatalogItem?.extraProperties?.forEach((property) => {
            data[property] = item.properties?.[property];
          });
          if (Object.keys(data).length === 0 && item.properties) {
            Object.entries(item.properties)?.forEach(([property, value]) => {
              data[property] = value;
            });
          }
          if (terria.geoshopCatalogItem?.shouldUseItemId) {
            data["id"] = item.id;
          }
          return data;
        }
      );
    const data = {
      productFormatId: productFormatId!,
      quantity: dataDefinition?.length ?? 1,
      attributes:
        attributesRef.current?.[
          (selectedAttributeCombinationIdRef.current ?? 1) - 1
        ]?.rawAttribute ?? [],
      dataDefinition
    };

    let jsonResponse;
    try {
      const response = await fetch(
        `${terria.configParameters.geoshopConfig?.baseApiUrl}/cart`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${terria.keycloak?.token}`
          },
          body: JSON.stringify(data)
        }
      );

      jsonResponse = await response.json();
    } catch (error) {
      console.log(error);
      if (!((error as any) instanceof SyntaxError) && !jsonResponse?.Error)
        return;
    }
    if (jsonResponse?.Error) {
      setNotification({
        success: false,
        title: t("geoshop.adding-item-error-occurred"),
        text: jsonResponse.Error?.Code
          ? t(jsonResponse.Error?.Code)
          : jsonResponse.Error?.Message,
        children: (
          <>
            {/*@ts-ignore*/}
            <Button primary rounded fullWidth onClick={addedToCart}>
              {/*@ts-ignore*/}
              <>Ok</>
            </Button>
          </>
        )
      });
    } else {
      const cartUrl = terria.configParameters.geoshopConfig?.shopUrl
        ? `${terria.configParameters.geoshopConfig.shopUrl}/cart`
        : undefined;

      setNotification({
        success: true,
        title: t("geoshop.adding-item-success"),
        text: t("geoshop.adding-item-success-text"),
        children: (
          <a target="_blank" rel="noopener noreferrer" href={cartUrl}>
            {t("geoshop.view-cart")} <ExternalLinkIcon />
          </a>
        )
      });
    }
  };

  const setAttributeCombination = useCallback((valueId: number) => {
    selectedAttributeCombinationIdRef.current = valueId;
    setForceRender((force) => force + 1);
  }, []);

  return terria.isWorkflowPanelActive && terria.geoshopCatalogItem ? (
    <WorkflowPanel
      viewState={viewState}
      icon={{ id: "geoshop" }}
      title={"Geoshop"}
      closeButtonText={t("geoshop.workflow.done")}
      onClose={action(() => {
        terria.geoshopCatalogItem?.stopSelection();
        terria.geoshopCatalogItem = undefined;
        terria.isWorkflowPanelActive = false;
        viewState.closeAttributeTable();
      })}
      footer={{
        onClick: addToCart,
        buttonText: t("geoshop.workflow.add-to-cart"),
        disabled: terria.geoshopCatalogItem.highlightItem?.itemsCount === 0
      }}
    >
      <Panel title={t("geoshop.workflow.product-description-panel-title")}>
        <span>
          {t("geoshop.workflow.add-to-cart", {
            itemCount: terria.geoshopCatalogItem.highlightItem?.itemsCount ?? 0
          })}
        </span>
        {name && <div>{t("geoshop.workflow.product-name", { name })}</div>}
        {description && (
          <div>
            {t("geoshop.workflow.product-description", { description })}
          </div>
        )}
      </Panel>
      <Panel
        title={t("geoshop.workflow.format-panel-title")}
        collapsible={true}
        isOpen={true}
      >
        {productFormats?.length === 1 ? (
          <>
            <div>
              {t("geoshop.workflow.format-type", {
                formatType: productFormats[0]?.productFormatType.name ?? ""
              })}
            </div>
          </>
        ) : (
          <SelectableDimension
            id={`${productId}`}
            dim={{
              type: "select",
              name: "Format",
              // @ts-ignore
              setDimensionValue: (_, v) => {
                setProductFormatId(v as never);
              },
              // @ts-ignore
              selectedId: productFormatId,
              allowUndefined: false,
              allowCustomInput: false,
              options: productFormats.map((format) => ({
                id: format.id,
                name: format.productFormatType.name
              }))
            }}
          />
        )}
        <div>
          {t("geoshop.workflow.format-description", {
            description: productFormats.find(
              (format) => format.id === productFormatId
            )?.description
          })}
        </div>
      </Panel>

      {attributesRef.current?.length > 0 && (
        <Panel
          title={t("geoshop.workflow.attributes-panel-title")}
          isOpen={true}
          collapsible={true}
        >
          <SelectableDimension
            key={attributeNameRef.current}
            id={`${attributeNameRef.current}`}
            dim={{
              type: "select",
              name: attributeNameRef.current,
              setDimensionValue: (s: string, v: string | undefined) => {
                setAttributeCombination(parseInt(v ?? "0"));
              },
              // @ts-ignore
              selectedId: selectedAttributeCombinationIdRef.current,
              allowUndefined: false,
              allowCustomInput: false,
              // @ts-ignore
              options: attributesRef.current.map((value) => ({
                id: value.id,
                name: value.value
              }))
            }}
          />
        </Panel>
      )}

      {/* {attributes?.map((attribute) => {
          return (
            <SelectableDimension
              key={attribute.id}
              id={`${attribute.id}`}
              dim={{
                type: "select",
                name: attribute.definitionName,
                setDimensionValue: (s, v) => {
                  setAttributeValues(attribute.id, v);
                },
                // @ts-ignore
                selectedId: selectedAttributeValuesRef.current.get(
                  attribute.id
                ),
                allowUndefined: false,
                allowCustomInput: false,
                // @ts-ignore
                options: attribute.values.map((value) => ({
                  id: value.id,
                  name: value.value
                }))
              }}
            />
          );
        })} */}

      {notification && (
        <NotificationPanel
          title={notification.title}
          text={notification.text}
          close={addedToCart}
        >
          {notification.children}
        </NotificationPanel>
      )}
    </WorkflowPanel>
  ) : null;
});

const NotificationBox = styled(Box).attrs({
  position: "absolute",
  styledWidth: "500px",
  styledMaxHeight: "320px",
  backgroundColor: "white",
  rounded: true,
  paddedRatio: 4,
  overflowY: "auto",
  scroll: true
})`
  z-index: 1000;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 6px 6px 0 rgba(0, 0, 0, 0.12), 0 10px 20px 0 rgba(0, 0, 0, 0.05);
  @media (max-width: ${(props) => props.theme.mobile}px) {
    width: 100%;
  }
`;

interface INotificationPanelProps {
  title: string;
  text: string;
  children: React.ReactNode;
  close: () => void;
}

const NotificationPanel: React.FC<INotificationPanelProps> = observer(
  (props: INotificationPanelProps) => {
    const theme = useTheme();
    const viewState = useViewState();
    return createPortal(
      <>
        <PrefaceBox
          onClick={() => props.close()}
          role="presentation"
          aria-hidden="true"
          pseudoBg
          css={{ top: 0, left: 0, zIndex: 99998 }}
        ></PrefaceBox>
        <NotificationBox column css={{ zIndex: 99999 }}>
          <CloseButton
            color={theme.darkWithOverlay}
            topRight
            onClick={() => props.close()}
          />
          <Text extraExtraLarge bold textDarker>
            {props.title}
          </Text>
          <Spacing bottom={5} />
          <Text medium textDark>
            {props.text}
          </Text>
          <Spacing bottom={5} />
          <Box centered>{props.children}</Box>
        </NotificationBox>
      </>,
      document.getElementById("about-us-panel") || document.body
    );
  }
);
