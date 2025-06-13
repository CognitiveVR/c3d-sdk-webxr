# The Cognitive3D SDK for Javascript

Welcome!  This SDK allows you to integrate your Javascript Applications with Cognitive3D, which provides analytics and insights about your VR/AR/MR project.  In addition, Cognitive3D empowers you to take actions that will improve users' engagement with your experience.

[![Build Status](https://travis-ci.org/CognitiveVR/cvr-sdk-js.svg?branch=master)](https://travis-ci.org/CognitiveVR/cvr-sdk-js)

## Quickstart

> Requirement of Node.js v20 or higher
>
> * We currently require a version of Node.js of 20 or higher for this SDK. If this doesn't match your needs, let us know.

## Cognitive3D Documentation

The documentation explains how to integrate the SDK, track your users' experience and how to export your scene to view on Cognitive3D.com.

[Go to the Docs](http://docs.cognitive3d.com/webxr/get-started/)

## Testing

> Note: The test suite points to a project on our Production platform with two scenes already set up. It uses the Application API Key, already in code, to run tests against that project. If you want to set up equivalent scenes in a different project, be sure to update the Application API Key to point there.

Jest is being used to test the sdk to run the test run the following command

`npm run test`

that will assume source code is being transpiled into lib folder. I.e. use `npm run build` before running the tests.

## Build

To ensure broader browser compatibility, source code written in ES6 needs to be transpiled. Run the following command to use Babel for this task:

`npm run build`
