package com.lucra.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.navigation.compose.rememberNavController
import com.lucra.android.navigation.AppNavHost

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Restore any previously logged in user before building the UI
        UserManager.init(applicationContext)
        setContent {
            MaterialTheme {
                Surface {
                    val navController = rememberNavController()
                    AppNavHost(navController)
                }
            }
        }
    }
}
