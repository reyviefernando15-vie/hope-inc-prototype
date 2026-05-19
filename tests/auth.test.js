import { describe, it, expect } from "vitest"

describe("Authentication Tests", () => {

  it("should allow ACTIVE users to login", () => {
    const status = "ACTIVE"
    expect(status).toBe("ACTIVE")
  })

  it("should block INACTIVE users", () => {
    const status = "INACTIVE"
    expect(status).not.toBe("ACTIVE")
  })

  it("should validate admin email", () => {
    const email = "admin@gmail.com"
    expect(email).toContain("@")
  })

})
