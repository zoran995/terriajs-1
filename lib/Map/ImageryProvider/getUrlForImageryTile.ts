import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import URI from "urijs";
import Resource from "terriajs-cesium/Source/Core/Resource";

function getUrlForImageryTile(
  imageryProvider: ImageryProvider,
  x: number,
  y: number,
  level: number,
  accessToken?: string
): string | undefined {
  const oldLoadImage = ImageryProvider.loadImage;

  let tileUrl;
  try {
    ImageryProvider.loadImage = function (
      _imageryProvider: ImageryProvider,
      url: string | Resource
    ) {
      if (typeof url === "string" || url instanceof String) {
        tileUrl = url;
      } else if (url.url) {
        tileUrl = url.url;

        // Add the Cesium Ion access token if there is one (for an IonResource).
        const ionAccessToken = (url as any)._ionEndpoint?.accessToken;
        if (ionAccessToken) {
          tileUrl = new URI(tileUrl)
            .addQuery("access_token", ionAccessToken)
            .toString();
        } else if (url.headers && url.headers.Authorization && accessToken) {
          tileUrl = new URI(tileUrl)
            .addQuery("access_token", accessToken)
            .toString();
        }
      }
      return undefined;
    };

    imageryProvider.requestImage(x, y, level);
  } finally {
    ImageryProvider.loadImage = oldLoadImage;
  }

  return tileUrl;
}

export default getUrlForImageryTile;
