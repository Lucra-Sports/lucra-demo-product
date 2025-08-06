package com.lucra.android.ui.screens

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import com.lucra.android.ui.theme.PrimaryColor
import com.lucra.android.ui.theme.SecondaryColor
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
    val animatedNumber = remember { Animatable(0f) }
    val scale = remember { Animatable(1f) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(targetNumber) {
        targetNumber?.let { target ->
            animatedNumber.snapTo(0f)
            scale.snapTo(1f)
            animatedNumber.animateTo(target.toFloat(), animationSpec = tween(durationMillis = 5000))
            scale.animateTo(1.2f, animationSpec = tween(durationMillis = 200))
            scale.animateTo(1f, animationSpec = tween(durationMillis = 200))
            user?.let { UserManager.addNumber(it.id, target) }
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
                    listOf(PrimaryColor, SecondaryColor)
                )
            )
            .statusBarsPadding()
            .padding(end = 16.dp, start = 16.dp, bottom = 16.dp)
    ) {
        Box(
            modifier = Modifier
                .padding(top = 16.dp)
                .size(48.dp)
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.3f))
                .clickable { navController.navigate("profile") }
                .align(Alignment.TopEnd),
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
                    .background(
                        Brush.horizontalGradient(listOf(PrimaryColor, SecondaryColor))
                    )
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
                Icon(Icons.Filled.Refresh, contentDescription = "Generate", tint = Color.White)
            }
            Spacer(modifier = Modifier.height(24.dp))
            if (targetNumber != null) {
                Text(
                    "${animatedNumber.value.toInt()}",
                    fontSize = 48.sp,
                    color = Color.White,
                    modifier = Modifier.scale(scale.value)
                )
            }
            Spacer(modifier = Modifier.height(24.dp))
            Row(
                modifier = Modifier
                    .horizontalScroll(rememberScrollState())
            ) {
                UserManager.recentNumbers.value.forEach { num ->
                    Box(
                        modifier = Modifier
                            .padding(horizontal = 4.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.White.copy(alpha = 0.3f))
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text(num.toString(), color = Color.White)
                    }
                }
            }
        }
    }
}
