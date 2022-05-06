"use strict";

module.exports = function(ctx) {
  // console.log(JSON.stringify(ctx, null, 2));

  console.log("Running modify_xcode_project.js");

  // make sure ios platform is part of platform add
  if (!ctx.opts.platforms.some((val) => val.startsWith("ios"))) {
    console.log("Not a IOS platform");
    return;
  }

  const fs = require('fs'),
        path = require('path'),
        join = require('path').join,
        xcode = require('xcode');

  let projectPath = 'platforms/ios/Feeds.xcodeproj/project.pbxproj',
      feedsProj = xcode.project(projectPath);
      // cordovaProjPath = 'platforms/ios/CordovaLib/CordovaLib.xcodeproj/project.pbxproj',
      // cordovaProj = xcode.project(cordovaProjPath);

  let promise = new Promise(function(resolve, reject) {
    (async () => {
      feedsProj.parse(function (err) {
        //
        // Embed frameworks and binaries
        //
        let embed = true;
        let existsEmbedFrameworks = feedsProj.buildPhaseObject('PBXCopyFilesBuildPhase', 'Embed Frameworks');
        if (!existsEmbedFrameworks && embed) {
          // "Embed Frameworks" Build Phase (Embedded Binaries) does not exist, creating it.
          feedsProj.addBuildPhase([], 'PBXCopyFilesBuildPhase', 'Embed Frameworks', null, 'frameworks');
        }

        // let options = { customFramework: true, embed: embed, sign: true };
        feedsProj.addFramework('libz.tbd');
        feedsProj.addFramework('libresolv.9.dylib');// for wallet plugin: Ethereum

        //
        // Build phase to strip invalid framework files ARCHs for itunes publication
        //
        let stripBuildPhaseCommand = "APP_PATH=\"${TARGET_BUILD_DIR}/${WRAPPER_NAME}\"\n\n# This script loops through the frameworks embedded in the application and\n# removes unused architectures.\nfind \"$APP_PATH\" -name '*.framework' -type d | while read -r FRAMEWORK\ndo\n    FRAMEWORK_EXECUTABLE_NAME=$(defaults read \"$FRAMEWORK/Info.plist\" CFBundleExecutable)\n    FRAMEWORK_EXECUTABLE_PATH=\"$FRAMEWORK/$FRAMEWORK_EXECUTABLE_NAME\"\n    echo \"Executable is $FRAMEWORK_EXECUTABLE_PATH\"\n\n    EXTRACTED_ARCHS=()\n\n    for ARCH in $ARCHS\n    do\n        echo \"Extracting $ARCH from $FRAMEWORK_EXECUTABLE_NAME\"\n        if lipo -extract \"$ARCH\" \"$FRAMEWORK_EXECUTABLE_PATH\" -o \"$FRAMEWORK_EXECUTABLE_PATH-$ARCH\"\n        then\n            EXTRACTED_ARCHS+=(\"$FRAMEWORK_EXECUTABLE_PATH-$ARCH\")\n        else\n            EXTRACTED_ARCHS+=(\"$FRAMEWORK_EXECUTABLE_PATH\")\n        fi\n    done\n\n    echo \"Merging extracted architectures: ${ARCHS}\"\n    lipo -o \"$FRAMEWORK_EXECUTABLE_PATH-merged\" -create \"${EXTRACTED_ARCHS[@]}\"\n    rm \"${EXTRACTED_ARCHS[@]}\"\n\n    echo \"Replacing original executable with thinned version\"\n    rm \"$FRAMEWORK_EXECUTABLE_PATH\"\n    mv \"$FRAMEWORK_EXECUTABLE_PATH-merged\" \"$FRAMEWORK_EXECUTABLE_PATH\"\n\ndone\n";
        var stripOptions = {
          shellPath: '/bin/sh',
          shellScript: stripBuildPhaseCommand
        };
        feedsProj.addBuildPhase([], 'PBXShellScriptBuildPhase', 'Strip non-target ARCHS from fat frameworks for publishing', null, stripOptions);

        //
        // Add build settings
        //
        feedsProj.addToBuildSettings("SWIFT_VERSION", "5.2");

        feedsProj.addToBuildSettings("CLANG_CXX_LANGUAGE_STANDARD", "\"c++0x\"");
        feedsProj.addToBuildSettings("MARKETING_VERSION", "1.1.0");

        //
        // Set SWIFT_OPTIMIZATION_LEVEL -Onone for Debug
        //
        feedsProj.updateBuildProperty('SWIFT_OPTIMIZATION_LEVEL', '"-Onone"', 'Debug');

        //
        // Write back the new XCode project
        //
        console.log("Writing to " + projectPath);
        fs.writeFileSync(projectPath, feedsProj.writeSync());
        resolve();
      })
    })()
  });

  return promise;
}
