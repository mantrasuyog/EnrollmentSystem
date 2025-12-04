# Debug-specific ProGuard rules
# These rules optimize for APK size while keeping debugging capabilities

# Don't obfuscate - keep original names for easier debugging
-dontobfuscate

# Don't optimize too aggressively for faster builds
-optimizationpasses 2

# Keep line numbers for crash reports
-keepattributes SourceFile,LineNumberTable

# Keep debugging attributes
-keepattributes *Annotation*,Signature,Exception

# Print mapping for easier debugging if needed
-printmapping mapping.txt

# Keep Tech5 libraries completely
-keep class ai.tech5.** { *; }
-keep interface ai.tech5.** { *; }
-keepclassmembers class ai.tech5.** { *; }
-keepclassmembers interface ai.tech5.** { *; }
-keepclassmembers class ai.tech5.**.* { *; }

# Keep native methods in Tech5
-keepclassmembers class ai.tech5.** {
    native <methods>;
}

# Keep Tech5 Activities and Services
-keep public class ai.tech5.**.** extends android.app.Activity
-keep public class ai.tech5.**.** extends android.app.Service

# Keep React Native
-keep class com.facebook.react.** { *; }
-keep interface com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep your app
-keep class com.enrollmentsystem.** { *; }
-keepclassmembers class com.enrollmentsystem.** { *; }

# Keep Android Support/AndroidX
-keep class androidx.** { *; }
-keep interface androidx.** { *; }

# Keep CameraX
-keep class androidx.camera.** { *; }
-keep interface androidx.camera.** { *; }

# Don't warn about missing classes (speeds up build)
-dontwarn **

# Keep all public classes and methods (easier debugging)
-keep public class * {
    public protected *;
}
