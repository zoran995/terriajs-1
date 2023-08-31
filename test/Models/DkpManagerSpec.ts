import loadJson from "../../lib/Core/loadJson";
import DkpManager, {
  parseCadMunicipalities
} from "../../lib/Models/DkpManager";
import Terria from "../../lib/Models/Terria";

describe("DkpManager API", function () {
  // Test comented out in order to pass devOps build, since it requires a VPN connection to RUGGIP in order to work. Might be usefull later so i'm leaving it here.

  /* describe("Test if API returns objects with valid fields", function() {
    const municipalityUrl = "http://localhost:3009/dkp/opstine";
    const cadastralMunicipalityUrl = "http://localhost:3009/dkp/ko/25";
    const parcelUrl =
      "http://localhost:3009/dkp/parcela/KZ/25/10?broj_parcele=11&pdbroj_parcele=0";

    let Municipality = {
      sifra: "",
      naziv: "",
      naziv_lat: ""
    };

    let CadastralMunicipality = {
      lokacija: "",
      kt: "",
      sifraKo: "",
      naziv: "",
      naziv_lat: "",
      naziv2: "",
      naziv2_lat: ""
    };

    let Parcel = {
      East: "",
      West: "",
      North: "",
      South: ""
    };

    it("API response should be valid array of municipality objects", function(done) {
      loadJson(municipalityUrl).then(result => {
        const municipalities = result.map((munic: any) => {
          expect(
            arrayEquals(
              Object.keys(Municipality).sort(),
              Object.keys(munic).sort()
            )
          ).toBeTruthy();
        });
        done();
      });
    });

    it("API response should be valid array of cadastral municipality objects", function(done) {
      loadJson(cadastralMunicipalityUrl).then(result => {
        const cadastralMunicipalities = result.map((munic: any) => {
          expect(
            arrayEquals(
              Object.keys(CadastralMunicipality).sort(),
              Object.keys(munic).sort()
            )
          ).toBeTruthy();
        });
        done();
      });
    });

    it("API response should be a valid parcel object", function(done) {
      loadJson(parcelUrl).then(result => {
        expect(
          arrayEquals(Object.keys(Parcel).sort(), Object.keys(result).sort())
        ).toBeTruthy();
        done();
      });
    });

    function arrayEquals(a: Object, b: Object) {
      return (
        Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, index) => val === b[index])
      );
    }
  }); */

  describe("DkpSearch tool functionalities", function () {
    let manager: DkpManager;
    beforeEach(function () {
      const terria = new Terria();
      manager = new DkpManager({ terria: terria });
    });

    // Test commented out and left here in order to have an example of spyOn method if needed later

    /* spyOn(manager, "loadMunicipalities").and.callFake(function() {
        return loadJson("test/DkpSearch/Municipality/municipalities.json");
      }); */

    /*     it("Loads all municipalities", async function(done) {
      const munics = await manager.loadMunicipalities();
      expect(munics.length).toEqual(63);
      const munic = munics[0];
      expect(munic.naziv).toEqual("Бања Лука");
      expect(munic.sifra).toEqual("25");
      expect(munic.naziv_lat).toEqual("Banja Luka");
      done();
    });

    it("Loads all cadastral municipalities for selected municipality", function(done) {
      const munic = {
        sifra: "25",
        naziv: "Бања Лука",
        naziv_lat: "Banja Luka"
      };
    }); */

    it("coorect parse", async function () {
      const cadastralMunic = parseCadMunicipalities(
        await loadJson("test/DkpSearch/CadastralMunicipality/BanjaLuka.json")
      );

      expect(cadastralMunic).toBeDefined();
      const valueArr = cadastralMunic.map((v) => v.nameCyr);
      const isDuplicate = valueArr.some((item, idx) => {
        return valueArr.indexOf(item) !== idx;
      });

      expect(isDuplicate).toBeFalsy;
    });
  });
});
