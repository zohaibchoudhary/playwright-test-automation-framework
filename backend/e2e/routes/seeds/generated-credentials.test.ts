import fs from "fs"
import {test, expect} from "@playwright/test"
import { getApiContext } from "../../common"

let apiConext: any;

test.describe("Get Credentials", () => {
  test.beforeAll(async({playwright}) => {
    apiConext = await getApiContext(playwright)
  })
  test.afterAll(async({}) => {
    await apiConext.dispose()
  })

  test.describe("GET:/api/v1/seed/generated-credentials - Get credentials", async() => {
    test("should return public/temp/seed-credentials.json", async({page}) => {
      const seedCredentialsText = fs.readFileSync(
        "./public/temp/seed-credentials.json",
        "utf8"
      )

      const seedCredentials = JSON.parse(seedCredentialsText)
      const res = await apiConext.get("/api/v1/seed/generated-credentials")
      const json = await res.json()

      expect(res.status()).toEqual(200)
      expect(json.data).toMatchObject(seedCredentials)
    })
  })
})

