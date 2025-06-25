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
#### a. Clone the repo
```
git clone https://github.com/CognitiveVR/c3d-sdk-webxr.git
cd c3d-sdk-webxr
```
#### b. Install the dependencies
```
npm install
```
#### c. Build the sdk
```
npm run build
```
#### d. Install the local sdk to your project 
```
npm install /pathTo/c3d-sdk-webxr
```
## Testing the SDK 
The SDK comes with a full test suite using Jest. The tests are configured to run against a live project on the Cognitive3D platform. Therefore, to successfully run these tests, you must first configure your own project on the Cognitive3D platform.

### 1. Configuration for testing 
#### a. Get your API Key
The SDK and tests scripts require a valid API Key to send data to a Cognitive3D project. Sign up at Cognitive3D.com, create a new project, and find your Application API Key on your dashboard.
#### b. Set the environment variable (API Key) 
The SDK's test configuration in settings.js reads your API key from an environment variable named C3D_APPLICATION_KEY. You must set this variable in your terminal before running the tests. 
##### On Windows (powershell) 
```
$env:C3D_APPLICATION_KEY="YOUR_API_KEY"
```
##### On MaxOS or Linux
```
export C3D_APPLICATION_KEY="YOUR_API_KEY"
```
#### c. Setup a scene on the Cognitive3D Dashboard (data-only with c3d-upload-tools) 
To view your projects analytics, you also need a "Scene" set up in your Cognitive3D account. This gives our platform a place to store the data you send from your application. You can create a scene and get the necessary Scene Name, Scene ID, and Scene Version by using our command-line utility.

Please following the instructions here: https://github.com/CognitiveVR/c3d-upload-tools



## Testing

> Note: The test suite points to a project on our Production platform with two scenes already set up. It uses the Application API Key, already in code, to run tests against that project. If you want to set up equivalent scenes in a different project, be sure to update the Application API Key to point there.

Rather than putting the Application Key in code, use this command instead:

`export C3D_APPLICATION_KEY=<Contact us for the application key>`

Jest is being used to test the sdk to run the test run the following command

`npm run test`

that will assume source code is being transpiled into lib folder. I.e. use `npm run build` before running the tests.

## Build

To ensure broader browser compatibility, source code written in ES6 needs to be transpiled. Run the following command to use Babel for this task:

`npm run build`
