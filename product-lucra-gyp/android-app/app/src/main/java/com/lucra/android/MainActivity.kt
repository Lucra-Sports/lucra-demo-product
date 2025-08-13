package com.lucra.android

import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.fragment.app.FragmentActivity
import androidx.navigation.compose.rememberNavController
import com.lucra.android.navigation.AppNavHost
import com.lucrasports.sdk.core.LucraClient
import com.lucrasports.sdk.core.style_guide.ClientTheme
import com.lucrasports.sdk.core.style_guide.ColorStyle
import com.lucrasports.sdk.core.ui.LucraFlowListener
import com.lucrasports.sdk.core.ui.LucraUiProvider
import com.lucrasports.sdk.ui.LucraUi

class MainActivity : FragmentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        LucraClient.initialize(
            apiKey = "coXydksUigTnn87Z6e45tabTSOaTBj0l",
            apiUrl = "api-rng.sandbox.lucrasports.com",
            environment = LucraClient.Companion.Environment.SANDBOX,
            lucraUiProvider = LucraUi(
                lucraFlowListener = object : LucraFlowListener {
                    override fun launchNewLucraFlowEntryPoint(entryLucraFlow: LucraUiProvider.LucraFlow): Boolean {
                        Log.d("Sample", "launchNewLucraFlowEntryPoint: $entryLucraFlow")
                        return true
                    }

                    override fun onFlowDismissRequested(entryLucraFlow: LucraUiProvider.LucraFlow) {
                        Log.d("Sample", "onFlowDismissRequested: $entryLucraFlow")

                    }
                }
            ),
            customLogger = null,
            outputLogs = true,
            clientTheme = ClientTheme(
                lightColorStyle = ColorStyle(
                    primary = "#ec4899",
                    secondary = "#ec4899",
                ),
                darkColorStyle = ColorStyle(
                    primary = "#ec4899",
                    secondary = "#ec4899",
                ),
            ),
            application = application
        )
        // Restore any previously logged in user before building the UI
        UserManager.init(applicationContext)
        setContent {
            MaterialTheme {
                Surface {
                    val navController = rememberNavController()
                    AppNavHost(
                        navController = navController,
                        onChallengeOpponent = {
                            val lucraFlow = LucraUiProvider.LucraFlow.CreateGamesMatchupById("highest score")
                            val lucraDialog = LucraClient().getLucraDialogFragment(lucraFlow)
                            lucraDialog.show(supportFragmentManager, lucraFlow.toString())
                        }
                    )
                }
            }
        }

        LucraClient().setDeeplinkTransformer { originalUri ->
            originalUri
        }
    }
}
