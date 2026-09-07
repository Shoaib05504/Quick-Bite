@echo off
set JAVA_HOME=C:\Users\Shoaib S W\jdk17
set JAVA_TOOL_OPTIONS=-Duser.timezone=UTC
set ANDROID_HOME=C:\Users\Shoaib S W\android-sdk
set PATH=C:\Users\Shoaib S W\jdk17\bin;%PATH%

if not exist "C:\Users\Shoaib S W\android-sdk\licenses" mkdir "C:\Users\Shoaib S W\android-sdk\licenses"
(
echo 24333f8a63718c1e559445181020a68856b346ba
echo 84831b9409646a5780fc63d221b32d28266fa405
echo d975fa17043998a366e6922e06799e201676e880
echo 709501415c1461e475877cb0471859c29d75b0d8
) > "C:\Users\Shoaib S W\android-sdk\licenses\android-sdk-license"

(
echo 84831b9409646a5780fc63d221b32d28266fa405
) > "C:\Users\Shoaib S W\android-sdk\licenses\android-sdk-preview-license"

echo Installing Android SDK packages...
"C:\Users\Shoaib S W\android-sdk\cmdline-tools\latest\bin\sdkmanager.bat" --sdk_root="C:\Users\Shoaib S W\android-sdk" "platforms;android-36" "platforms;android-34" "build-tools;36.0.0" "build-tools;34.0.0" "platform-tools"
