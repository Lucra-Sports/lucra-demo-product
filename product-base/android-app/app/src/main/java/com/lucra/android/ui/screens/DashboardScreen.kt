package com.lucra.android.ui.screens

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.icons.Icons
import androidx.compose.material3.icons.filled.Casino
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.Alignment
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.lucra.android.UserManager
import com.lucra.android.api.ApiClient
import kotlinx.coroutines.launch

@Composable
fun DashboardScreen(navController: NavController) {
    val user = UserManager.currentUser.value
    var targetNumber by remember { mutableStateOf<Int?>(null) }
    var animatedNumber by remember { mutableStateOf(0) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(targetNumber) {
        targetNumber?.let { target ->
            val anim = Animatable(0f)
            anim.animateTo(target.toFloat(), animationSpec = tween(durationMillis = 5000))
            animatedNumber = anim.value.toInt()
        }
    }

    if (user == null) {
        LaunchedEffect(Unit) { navController.navigate("login") }
        return
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        Color(0xFF4F46E5),
                        Color(0xFF8B5CF6),
                        Color(0xFFEC4899)
                    )
                )
            )
            .padding(16.dp)
    ) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.3f))
                .clickable { navController.navigate("profile") }
                .align(Alignment.TopStart),
            contentAlignment = Alignment.Center
        ) {
            Text("\uD83D\uDC64", fontSize = 24.sp)
        }

        Column(
            modifier = Modifier.align(Alignment.Center),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(120.dp)
                    .clip(CircleShape)
                    .background(Color.White)
                    .clickable {
                        scope.launch {
                            try {
                                val result = ApiClient.service.generateNumber(user.id)
                                targetNumber = result.number
                            } catch (e: Exception) {
                            }
                        }
                    },
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Filled.Casino, contentDescription = "Generate")
            }
            Spacer(modifier = Modifier.height(24.dp))
            if (targetNumber != null) {
                Text("$animatedNumber", fontSize = 48.sp, color = Color.White)
            }
        }
    }
}
