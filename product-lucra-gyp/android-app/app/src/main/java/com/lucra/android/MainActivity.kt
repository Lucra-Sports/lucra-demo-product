package com.lucra.android

import android.content.Intent
import android.os.Bundle
import android.util.Log
import com.lucra.android.UserManager // ✅ your class
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.fragment.app.DialogFragment
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.lifecycleScope
import androidx.navigation.compose.rememberNavController
import com.lucra.android.api.ApiClient
import com.lucra.android.api.UserBindingRequest
import com.lucra.android.navigation.AppNavHost
import com.lucrasports.sdk.core.LucraClient
import com.lucrasports.sdk.core.style_guide.ClientTheme
import com.lucrasports.sdk.core.style_guide.ColorStyle
import com.lucrasports.sdk.core.ui.LucraFlowListener
import com.lucrasports.sdk.core.ui.LucraUiProvider
import com.lucrasports.sdk.core.user.SDKUserResult
import com.lucrasports.sdk.ui.LucraUi
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch

class MainActivity : FragmentActivity() {

    var cachedLucraFlow: LucraUiProvider.LucraFlow? = null

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
                        supportFragmentManager.findFragmentByTag(entryLucraFlow.toString())?.let {
                            Log.d("Sample", "Found $entryLucraFlow as $it")

                            if (it is DialogFragment)
                                it.dismiss()
                            else
                                supportFragmentManager.beginTransaction().remove(it).commit()
                        } ?: run {
                            Log.d("Sample", "onFlowDismissRequested: $entryLucraFlow not found")
                        }
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
                            val lucraFlow =
                                LucraUiProvider.LucraFlow.CreateGamesMatchup()
                            val lucraDialog = LucraClient().getLucraDialogFragment(lucraFlow)
                            lucraDialog.show(supportFragmentManager, lucraFlow.toString())
                        },
                        onLogin = {
                            if (cachedLucraFlow != null) {
                                LucraClient().apply {
                                    getLucraDialogFragment(cachedLucraFlow!!).also { fragment ->
                                        fragment.show(supportFragmentManager, cachedLucraFlow.toString())
                                    }
                                }
                                cachedLucraFlow = null
                            }
                        }
                    )
                }
            }
        }

        LucraClient().setDeeplinkTransformer { originalUri ->
            "rng://$originalUri"
        }


        observeLoggedInUser()
        handleDeeplinkIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleDeeplinkIntent(intent)
    }

    private fun handleDeeplinkIntent(intent: Intent) {
        val action = intent.action
        val data = intent.data

        if (Intent.ACTION_VIEW == action && data != null) {
            val deeplinkUrl = data.toString()
            processDeeplink(deeplinkUrl)
        }
    }

    private fun processDeeplink(deeplinkUrl: String) {
        LucraClient().apply {
            val extractedLucraUri = extractLucraUriFromDeeplink(deeplinkUrl)
            extractedLucraUri?.let {
                getLucraFlowForDeeplinkUri(it)
            }?.let { lucraFlow ->
                if (UserManager.isLoggedIn()) {
                    getLucraDialogFragment(lucraFlow).also { fragment ->
                        fragment.show(supportFragmentManager, lucraFlow.toString())
                    }
                } else {
                    cachedLucraFlow = lucraFlow
                }
            }
        }
    }

    fun extractLucraUriFromDeeplink(deeplinkUrl: String): String? {
        return if (deeplinkUrl.startsWith("rng://")) {
            deeplinkUrl.removePrefix("rng://")
        } else {
            deeplinkUrl // Return as-is if no rng:// prefix
        }
    }

    private fun observeLoggedInUser() {
        LucraClient().observeSDKUserFlow().onEach { sdkUserResult ->
            when (sdkUserResult) {
                is SDKUserResult.Success -> {
                    if (sdkUserResult.sdkUser.userId != null && UserManager.currentUser.value?.id != null) {
                        lifecycleScope.launch {
                            val rngUserId = UserManager.currentUser.value?.id
                            try {
                                val response = ApiClient.service.bindUser(
                                    rngUserId!!,
                                    UserBindingRequest(
                                        externalId = sdkUserResult.sdkUser.userId!!,
                                        type = "Lucra",
                                    )
                                )

                            } catch (e: Exception) {
                            }
                            UserManager.setLucraUserId(sdkUserResult.sdkUser.userId!!)
                        }
                    }
                }

                is SDKUserResult.Error -> {

                }

                SDKUserResult.InvalidUsername -> {
                    // Shouldn't happen here
                }

                SDKUserResult.NotLoggedIn -> {

                }

                SDKUserResult.Loading -> {

                }

                SDKUserResult.WaitingForLogin -> {

                }
            }
        }.launchIn(lifecycleScope)
    }
}
