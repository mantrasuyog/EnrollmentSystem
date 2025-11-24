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

# Don't warn about missing classes (speeds up build)
-dontwarn **

# Keep all public classes and methods (easier debugging)
-keep public class * {
    public protected *;
}
