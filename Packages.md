# Node Packages

## 1.	"npm"
- Node package manager
- Not used in code but neccesary
- Bundled with Node
- https://www.npmjs.com/package/npm

## 2.	"express"
- Web framework Used everywhere
- https://expressjs.com/en/4x/api.html

## 3.	"amazon-cognito-identity-js"
- https://github.com/aws/aws-amplify/tree/master/packages/amazon-cognito-identity-js

## 4.	"amazon-cognito-identity-js-node"
- Used to make amazon-cognito-identity-js work with node
- Authenticates a cognito user.
- Used in:
    - API/CognitoAPI/Strategy.js
    - API/CognitoAPI/UserValidator.js
- https://www.npmjs.com/package/amazon-cognito-identity-js-node

## 5.	"aws-sdk"
- https://www.npmjs.com/package/aws-sdk
- Used to create AWS.CognitoIdentityServiceProvider
    - https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CognitoIdentityServiceProvider.html

## 6.	"express-session"
- Stores and reads session in cookies. Not used but available
- https://www.npmjs.com/package/express-session

## 7.	"morgan"
- Installed by Express
- Logger
- https://www.npmjs.com/package/morgan

## 8.	"pug"
- HTML template engine
- Reads “*.pug” files located in /views/ and converts them to HTML pages
- https://pugjs.org/api/getting-started.html

## 9.	"request"
- Used to makes HTTP(GET/POST/DELETE) requests to other websites
- https://www.npmjs.com/package/request
- Mostly used to make HTTP requsts to IdealSpaces API
    -  Routes/idealspacesRouter.js
    - routes/ISCognitoQueryManager.js

## 10.	"soap"
- Used to call ASPNET WebServices
- https://www.npmjs.com/package/soap
- Only used in WebService API

## 11.	"xml2js"
- Used to convert xml files to JSON
    - The only xml file converted for now is Integration/butintegrationconfig.xml
- https://www.npmjs.com/package/xml2js
- Used in
    - app.js

## 12.	"body-parser"
- https://www.npmjs.com/package/body-parser
- Parses a HTTP request body

## 13.	"connect-flash"
- Stores messages in session
- https://www.npmjs.com/package/connect-flash

## 14.	"cookie-parser"
- Parses cookies if they are present
- https://www.npmjs.com/package/cookie-parser

## 15.	"debug"
- Debugging utility
- https://www.npmjs.com/package/debug

## 16.	"jwt-decode"
- Encodes and Decodes jwt tokens
- https://www.npmjs.com/package/express-session
