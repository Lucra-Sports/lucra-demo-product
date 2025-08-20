package com.lucra.android

import android.app.Application
import coil.ImageLoaderFactory
import com.lucrasports.apphost.LucraCoilImageLoader

class App : Application(), ImageLoaderFactory {
    override fun newImageLoader() = LucraCoilImageLoader.get(this)
}