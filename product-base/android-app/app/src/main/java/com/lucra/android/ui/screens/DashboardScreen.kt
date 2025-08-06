package com.lucra.android.ui.screens

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.lucra.android.UserManager
import com.lucra.android.api.ApiClient
import com.lucra.android.ui.theme.PrimaryColor
import com.lucra.android.ui.theme.SecondaryColor
import kotlinx.coroutines.launch
import java.text.NumberFormat

@Composable
fun DashboardScreen(navController: NavController) {
    val user = UserManager.currentUser.value
    var targetNumber by remember { mutableStateOf<Int?>(null) }
    val animatedNumber = remember { Animatable(0f) }
    val scale = remember { Animatable(1f) }
    val scope = rememberCoroutineScope()
    var isGenerating by remember { mutableStateOf(false) }
    var totalNumbers by remember { mutableStateOf(0) }
    var lastAdded by remember { mutableStateOf<Int?>(null) }
    val pacifico = FontFamily(Font(com.lucra.android.R.font.pacifico_regular))

    LaunchedEffect(Unit) {
        user?.let {
            runCatching { ApiClient.service.getStats(it.id) }.onSuccess { stats ->
                totalNumbers = stats.totalNumbersGenerated
            }
        }
    }

    LaunchedEffect(targetNumber) {
        targetNumber?.let { target ->
            animatedNumber.snapTo(0f)
            scale.snapTo(1f)
            animatedNumber.animateTo(target.toFloat(), animationSpec = tween(durationMillis = 5000))
            scale.animateTo(1.2f, animationSpec = tween(durationMillis = 200))
            scale.animateTo(1f, animationSpec = tween(durationMillis = 200))
            user?.let {
                UserManager.addNumber(it.id, target)
                totalNumbers += 1
                lastAdded = target
            }
            isGenerating = false
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
            .padding(start = 16.dp, end = 16.dp, bottom = 16.dp)
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
            Icon(Icons.Filled.Person, contentDescription = "Profile", tint = Color.White)
        }

        Text(
            "RNG",
            fontSize = 48.sp,
            color = Color.White,
            fontFamily = pacifico,
            modifier = Modifier
                .align(Alignment.TopCenter)
                .padding(top = 16.dp)
        )

        if (targetNumber != null) {
            Text(
                NumberFormat.getNumberInstance().format(animatedNumber.value.toInt()),
                fontSize = 80.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Color.White,
                modifier = Modifier
                    .align(Alignment.Center)
                    .scale(scale.value)
            )
        } else {
            Text(
                "Press the button to generate a number!",
                fontSize = 24.sp,
                color = Color.White,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .align(Alignment.Center)
                    .padding(16.dp)
            )
        }

        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            LazyRow(modifier = Modifier.padding(bottom = 16.dp)) {
                val numbers = UserManager.recentNumbers.value
                items(numbers.take(10)) { num ->
                    val isNew = num == lastAdded && numbers.firstOrNull() == num
                    val itemScale = remember { Animatable(1f) }
                    LaunchedEffect(isNew) {
                        if (isNew) {
                            itemScale.snapTo(0f)
                            itemScale.animateTo(1f, animationSpec = tween(durationMillis = 300))
                        }
                    }
                    Box(
                        modifier = Modifier
                            .padding(horizontal = 4.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.White.copy(alpha = 0.3f))
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                            .scale(itemScale.value)
                    ) {
                        Text(num.toString(), color = Color.White)
                    }
                }
                if (totalNumbers > 10) {
                    item {
                        Box(
                            modifier = Modifier
                                .padding(horizontal = 4.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .background(Color.White.copy(alpha = 0.3f))
                                .clickable { navController.navigate("history") }
                                .padding(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Text("View All", color = Color.White)
                        }
                    }
                }
            }
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .clip(CircleShape)
                    .background(PrimaryColor)
                    .clickable(enabled = !isGenerating) {
                        scope.launch {
                            try {
                                isGenerating = true
                                val result = ApiClient.service.generateNumber(user.id)
                                targetNumber = result.number
                            } catch (e: Exception) {
                                isGenerating = false
                            }
                        }
                    },
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    painterResource(id = com.lucra.android.R.drawable.ic_dice),
                    contentDescription = "Generate",
                    tint = Color.Unspecified
                )
            }
        }
    }
}
