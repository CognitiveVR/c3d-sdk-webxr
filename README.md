# The Cognitive3D SDK for Javascript and WebXR

Welcome!  This SDK allows you to integrate your Javascript and WebXR Applications with Cognitive3D, which provides analytics and insights about your VR/AR/MR project.  In addition, Cognitive3D empowers you to take actions that will improve users' engagement with your experience.

[![Build Status](https://travis-ci.org/CognitiveVR/cvr-sdk-js.svg?branch=master)](https://travis-ci.org/CognitiveVR/cvr-sdk-js)

## Quickstart

> Requirement of Node.js v20 or higher
>
> * We currently require a version of Node.js of 20 or higher for this SDK. If this doesn't match your needs, let us know.

## Cognitive3D Documentation

The documentation explains how to integrate the SDK, track your users' experience and how to export your scene to view on Cognitive3D.com.

[Go to the Docs](http://docs.cognitive3d.com/webxr/get-started/)

## Installation 
You can add Cognitive3D to your javascript project in two ways. 
### Option 1. Install from NPM
Inside your javascript project's terminal, run the following command 
```
npm install @cognitive3d/analytics
```
### Option 2. Install from source code
If you want the entire source code, whether that be to run tests, make modifications, you can clone this repository by
#### A) Clone the repo
```bash
git clone https://github.com/CognitiveVR/c3d-sdk-webxr.git
cd c3d-sdk-webxr
```
#### B) Install the dependencies
```bash
npm install
```
#### C) Build the sdk
This will transpile the SDK src files into a `/lib` folder
```bash
npm run build
```
#### D) Install the local sdk to your project 
```bash
npm install /pathTo/c3d-sdk-webxr
```
## Testing the SDK 
The SDK comes with a full test suite using Jest. The tests are configured to run against a live project on the Cognitive3D platform. Therefore, to successfully run these tests, you must first configure your own project on the Cognitive3D platform.

### 1. Configuration for testing 
#### A) Get your API Key
The SDK and tests scripts require a valid API Key to send data to a Cognitive3D project. Sign up at Cognitive3D.com, create a new project, and find your Application API Key on your dashboard.
#### B) Set the environment variable (API Key) 
The SDK's test configuration in `settings.js` reads your API key from an environment variable named `C3D_APPLICATION_KEY`. You must set this variable in your terminal before running the tests. 
##### On Windows (powershell) 
```powershell
$env:C3D_APPLICATION_KEY="YOUR_API_KEY"
```
##### On MaxOS or Linux
```bash
export C3D_APPLICATION_KEY="YOUR_API_KEY"
```
#### C) Setup a scene on the Cognitive3D Dashboard (with c3d-upload-tools) 
To view your projects analytics, you also need a "Scene" set up in your Cognitive3D account. This gives our platform a place to store the data you send from your application. You can create a scene and get the necessary `Scene Name`, `Scene ID`, and `Scene Version` by using our command-line utility.

Please following the instructions here: https://github.com/CognitiveVR/c3d-upload-tools

#### D) Update SDK's Scene Information 
Now that you have created obtained an API KEY and setup a "Scene" on Cognititve3D, you now have to update `settings.js` to point to scenes within your own Cognitive3D Project. 

Open `settings.js` and modify the `allSceneData` array to match the `Scene Name`, `Scene ID`, and `Scene Version` from your own Cogntitve3D dashboard. Example: 
```javascript
// settings.js
allSceneData: [
    { // Scene 1 
        sceneName: "YOUR_SCENE_NAME", 
        sceneId: "YOUR_SCENE_ID", 
        versionNumber: "YOUR_SCENE_VERSION",
    },
    { // Scene 2 
        sceneName: "YOUR_SECOND_SCENE_NAME",
        sceneId: "YOUR_SECOND_SCENE_ID",
        versionNumber: "YOUR_SECOND_SCENE_VERSION"
    }
],
```
Note: Depending on how many scenes you have, you can duplicate entrys or remove them from the array.

### 2. Testing the SDK 
There are currently 56 tests within 9 test suites located inside of `__tests__`. These tests provide comprehensive coverage for the SDK's core features, including:

- Session initialization and lifecycle management.
- Sending custom events, gaze data, and sensor data.
- Registering and tracking dynamic objects.
- Requesting and submitting Exit Polls.

*Note: Please be aware that a some tests currently contain hardcoded values that you will need to change to match your specific setup.* For example:

- `__tests__/dynamic-test.js` expects scenes named "BasicScene" and "AdvancedScene".

- `__tests__/exitpoll-test.js` uses a specific hook named "app_test_js". Therefore, please create your own Exit Poll on your Cognitive3D dashboard and replace this hook with your own. 

#### A) Build the SDK with configured settings 
Once your API KEY and scene information is set. We have to again build the SDK: 
```bash
npm run build
```
#### B) Run the test suites  
```bash
npm run test
```
If everything is setup correctly, you should see all 9 test suites pass. 

## Usage

The SDK is designed to be flexible and can be integrated into various JavaScript projects. The build process creates multiple module formats in the `/lib` folder to support different environments.
- index.umd.js (Universal Module Definition): One-size-fits-all for direct use in browsers. It's designed to be dropped into a <script> tag on a webpage. 
- index.esm.js (ES Module): The modern module standard for JavaScript. It's used by default in most web bundlers and modern Node.js.
- index.cjs.js (CommonJS): The module format for older Node.js environments.

### Playcanvas integration 
You can upload the built `/lib/index.umd.js` to a PlayCanvas project. 

### ThreeJS Integration 
Inside your ThreeJS project, run  `npm install @cognitive3d/analytics` or if you have the sdk locally: `npm install /pathTo/c3d-sdk-webxr`  

### Initializing the Cognitive3D SDK in your JavaScript project
```javascript
// MyApp.js 
import C3D from '@cognitive3d/analytics';

// 1. Define your project's configuration, replace these values with the ones from your project
const settings = {
    config: {
        APIKey: "YOUR_APPLICATION_KEY_HERE",
        allSceneData: [
            {
                sceneName: "YOUR_SCENE",
                sceneId: "YOUR_SCENE_ID_",
                versionNumber: "1"
            }
        ],
    }
};

// 2. Initialize the C3D Analytics
const c3d = new C3D(settings);

// 3. Set properties that identify the user and device

c3d.setScene('BasicScene'); // Replace with your Scene name
c3d.userId = 'userid' + Date.now();
c3d.setUserName('SDK_Test_User');
c3d.setDeviceName('WindowsPCBrowserVR');
c3d.setDeviceProperty("AppName", "ThreeJS_WebXR_SDK_Test_App");
c3d.setUserProperty("c3d.version", "1.0");
c3d.setUserProperty("c3d.app.version", "0.2");
c3d.setUserProperty("c3d.app.engine", "Three.js");
c3d.setUserProperty("c3d.deviceid", 'threejs_windows_device_' + Date.now());

// 4.Start the C3D Session
c3d.startSession();

// 5. Insert code here to track other events, gaze, etc.

// 6. End the C3D session 
 c3d.endSession(); 
```
*Note: Ensure all properties are included as shown above, otherwise you may not see a valid session on the Cognitive3D dashboard* 

## Examples Projects
For more detailed examples and complete project integrations, please see our sample applications repository at: https://github.com/CognitiveVR/c3d-webxr-sample-apps 
