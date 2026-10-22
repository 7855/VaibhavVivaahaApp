# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:

# ── R8 on (2026-10-06) ───────────────────────────────────────────────────
# React Native / Hermes: JNI-bound classes are looked up by name from C++,
# so R8 must not rename or strip them (RN's own docs list these).
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }
# Our own RN bridge for Cashfree: the SDK's AARs keep their public API via
# consumer rules; this keeps the thin module that calls it.
-keep class com.reactnativecashfreepgsdk.** { *; }
# Crash reports stay readable: the mapping file is embedded in the AAB.
-keepattributes SourceFile,LineNumberTable

# 2026-10-09 — the image picker stopped opening on the R8 builds (versionCode 7+):
# R8 renamed ~80% of expo.modules.* (picker, image-manipulator, expo-modules-core),
# and the Expo modules runtime resolves records/types/activity-result contracts by
# Kotlin reflection. Keep the whole Expo native layer as-is; everything else still
# shrinks and obfuscates.
-keep class expo.** { *; }
-keep class host.exp.** { *; }
-keep class kotlin.Metadata { *; }
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod,RuntimeVisibleAnnotations,RuntimeVisibleParameterAnnotations
-dontwarn expo.**
