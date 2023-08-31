import i18next, { TFunction } from "i18next";
import Keycloak, { KeycloakInitOptions } from "keycloak-js";
import { action, observable, runInAction, makeObservable } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import styled, { DefaultTheme, withTheme } from "styled-components";
import isDefined from "../../Core/isDefined";
import TerriaError from "../../Core/TerriaError";
import AccessControlMixin from "../../ModelMixins/AccessControlMixin";
import { BaseModel } from "../../Models/Definition/Model";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";
import { StyledIcon, GLYPHS } from "../../Styled/Icon";
import MenuButton from "../StandardUserInterface/customizable/menu-button.scss";
import MobileMenuItem from "./../Mobile/mobile-menu-item.scss";

interface SignInProps extends WithTranslation {
  t: TFunction;
  theme: DefaultTheme;
  viewState: ViewState;
}

export interface UserInfo {
  email?: string;
  preferred_username?: string;
  username?: string;
  name: string;
}

const StyledButton = styled.button`
  background-color: ${(props) => props.theme.colorPrimary} !important;
  svg {
    fill: ${(props) => props.theme.textLight} !important;
  }
`;

@observer
class SignIn extends React.Component<SignInProps> {
  static displayName = "SignInButton";

  @observable
  isSignedIn: boolean = false;

  keycloak?: Keycloak.KeycloakInstance;

  keycloakInit?: KeycloakInitOptions;

  terria: Terria;

  constructor(props: SignInProps) {
    super(props);
    makeObservable(this);
    this.terria = props.viewState.terria;

    if (!isDefined(this.terria.keycloak)) {
      this.terria.raiseErrorToUser(
        new TerriaError({
          title: props.t("auth.initErrorTitle"),
          message: props.t("auth.initErrorMessage", {
            email:
              '<a href="mailto:' +
              this.terria.supportEmail +
              '">' +
              this.terria.supportEmail +
              "</a>"
          })
        })
      );
      return;
    }
    this.keycloak = this.terria.keycloak!;
    this.keycloakInit = {
      //useNonce: true,
      onLoad: "check-sso",
      silentCheckSsoRedirectUri:
        window.location.origin + "/silent-check-sso.html",
      adapter: "default",
      pkceMethod: "S256"
    };
    if (this.keycloak) {
      this.keycloak.onAuthLogout = () => {
        if (this.isSignedIn) {
          this.onLogOut();
        }
      };
    }
    if (this.keycloak) {
      this.keycloak.onTokenExpired = () => {
        const that = this;
        this.keycloak!.updateToken(120)
          .then(function (refreshed: boolean) {
            if (refreshed) {
              const token = that.keycloak!.token;
            }
          })
          .catch(function () {
            that.signIn();
          });
      };
    }
    this.checkSso();
  }

  @action.bound
  checkSso() {
    try {
      this.keycloak?.init(this.keycloakInit!).then((authenticated: any) => {
        if (authenticated) {
          this.keycloak?.loadUserInfo().then((response: any) => {
            runInAction(() => {
              this.terria.userInfo = response;
            });
          });
          runInAction(() => {
            this.isSignedIn = true;
          });
        } else {
          this.clearUserInfo();
        }
      });
    } catch (e) {}
  }

  @action.bound
  signIn() {
    this.keycloak?.init(this.keycloakInit!).then((authenticated: any) => {
      if (!authenticated) {
        const that = this;
        //@ts-ignore
        window.authenticationComplete = function () {
          that.checkSso();
        };
        const locales =
          this.terria.configParameters.keycloakConfig?.localeMapping;
        let locale: string | undefined;
        if (locales) {
          locale = locales[i18next.language];
        }
        const url = this.keycloak?.createLoginUrl({
          redirectUri: window.location.origin + "/done-auth.html",
          locale: locale
        });
        const left = window.screenX || 0;

        const newWindow = window.open(
          url,
          "keycloak-login",
          `height=500,width=600,menubar=no,location=yes,resizable=yes,scrollbars=yes,status=yes,left=${left}`
        );
        if (window.document.hasFocus()) {
          newWindow?.focus();
        }
        //window.location.reload();
      } else {
        this.keycloak?.loadUserInfo().then((response: any) => {
          runInAction(() => {
            this.terria.userInfo = response;
          });
        });
        runInAction(() => {
          this.isSignedIn = true;
        });
      }
    });
  }

  @action.bound
  signOut() {
    const that = this;
    //@ts-ignore
    window.authenticationComplete = function () {
      that.checkSso();
    };
    const url = this.keycloak?.createLogoutUrl({
      redirectUri: window.location.origin + "/done-auth.html"
    });
    window.open(
      url,
      "keycloak-login",
      "height=500,width=600,menubar=no,location=yes,resizable=yes,scrollbars=yes,status=yes"
    );
  }

  @action.bound
  onLogOut() {
    this.clearUserInfo();
    this.terria.workbench.items.forEach((item) => {
      if (AccessControlMixin.isMixedInto(item) && item.isPrivate) {
        this.clearPrivateState();
      }
    });
  }

  @action
  clearPrivateState() {
    const isPrivate = (model: BaseModel) =>
      AccessControlMixin.isMixedInto(model) && model.isPrivate;
    this.terria.workbench.items.forEach((item) => {
      if (item && isPrivate(item)) {
        this.terria.workbench.remove(item);
      }
    });
  }

  @action.bound
  clearUserInfo() {
    this.isSignedIn = false;
    this.terria.userInfo = undefined;
  }

  renderSignedId(rootStyle: any, buttonStyle: any) {
    const { t } = this.props;
    const userInfo = this.terria.userInfo;
    const userString: string =
      this.isSignedIn && userInfo
        ? userInfo.name
          ? userInfo.name
          : userInfo.email
          ? userInfo.email
          : userInfo.username
          ? userInfo.username
          : ""
        : "";

    return (
      <div className={rootStyle}>
        <StyledButton className={buttonStyle} onClick={this.signOut}>
          <StyledIcon glyph={GLYPHS.user} light styledWidth={"20px"} />
          <span>{userString + " - " + t("auth.logout")}</span>
        </StyledButton>
      </div>
    );
  }

  renderNotSignedIn(rootStyle: any, buttonStyle: any) {
    const { t } = this.props;
    return (
      <div className={rootStyle}>
        <button className={buttonStyle} onClick={this.signIn}>
          <StyledIcon glyph={GLYPHS.user} light styledWidth={"20px"} />
          <span>{t("auth.login")}</span>
        </button>
      </div>
    );
  }

  render() {
    const viewState = this.props.viewState;
    const rootStyle = viewState.useSmallScreenInterface
      ? MobileMenuItem.root
      : undefined;
    const buttonStyle = viewState.useSmallScreenInterface
      ? MobileMenuItem.link
      : MenuButton.btnAboutLink;

    return this.isSignedIn
      ? this.renderSignedId(rootStyle, buttonStyle)
      : this.renderNotSignedIn(rootStyle, buttonStyle);
  }
}

export default withTranslation()(withTheme(SignIn));
