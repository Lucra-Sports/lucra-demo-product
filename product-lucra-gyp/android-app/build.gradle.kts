import java.util.Properties

buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.10.1")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.10")
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
        maven(url = "https://jitpack.io" )
        maven(url = "https://zendesk.jfrog.io/zendesk/repo")
        maven {
            name = "LucraGithubPackages"
            url = uri("https://maven.pkg.github.com/Lucra-Sports/lucra-android-sdk")
            credentials {
                val localProps = Properties().apply {
                    load(rootProject.file("local.properties").inputStream())
                }

                val gprUser = localProps.getProperty("GPR_USER")
                    ?: System.getenv("GPR_USER")
                val gprKey = localProps.getProperty("GPR_KEY")
                    ?: System.getenv("GPR_KEY")


                if (gprUser.isNullOrEmpty()) {
                    throw GradleException("GPR_USER not set in ~ .gradle/gradle.properties, local gradle.properties or as an environment variable.")
                }
                if (gprKey.isNullOrEmpty()) {
                    throw GradleException("GPR_KEY not set in ~ .gradle/gradle.properties, local gradle.properties or as an environment variable.")
                }

                username = gprUser
                password = gprKey // Do not check-in your PAT!
            }
        }
    }
}
