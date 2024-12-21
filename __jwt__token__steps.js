/**
 *
 * JWT Token Steps:
 *
 * 1. After succecfull login, generate a jwt token and send it to the client.
 * npm i jsonwebtoken cookie-parser
 * jwt.sign(payload, secret, {expiresIn: "1h"})
 *
 *
 * 2. send the token (generated in server side) to the client side
 * localstorage --> easy to access, but not secure
 *
 * httpOnly cookie --> better than localstorage
 *
 *
 * 3. for sensitive / secure / private apis, send token to the server side
 *
 * 
 * 4. validate the token in the server side:
 * if valid: provide data
 * if invalid: logout
 * 
 */