package com.enrollmentsystem

import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.PackageList
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import com.enrollmentsystem.tech5finger.Tech5FingerPackage
import com.enrollmentsystem.tech5face.Tech5FacePackage

class MainApplication : Application(), ReactApplication {

  private val mReactNativeHost: ReactNativeHost = object : ReactNativeHost(this) {
    override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

    override fun getPackages(): List<ReactPackage> {
      val packages = PackageList(this@MainApplication).packages.toMutableList()
      packages.add(Tech5FingerPackage())
      packages.add(Tech5FacePackage())
      return packages
    }

    override fun getJSMainModuleName(): String = "index"
  }

  override val reactNativeHost: ReactNativeHost
    get() = mReactNativeHost

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, OpenSourceMergedSoMapping)
  }
}
