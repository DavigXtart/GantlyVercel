package com.alvaro.psicoapp.security;

import java.io.IOException;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.alvaro.psicoapp.service.AuthService;
import com.alvaro.psicoapp.service.OAuthCodeStoreService;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

	private final AuthService authService;
	private final OAuthCodeStoreService oauthCodeStore;
	private final String frontendBaseUrl;

	public OAuth2SuccessHandler(AuthService authService, OAuthCodeStoreService oauthCodeStore,
			@Value("${app.base.url:http://localhost:5173}") String frontendBaseUrl) {
		this.authService = authService;
		this.oauthCodeStore = oauthCodeStore;
		this.frontendBaseUrl = frontendBaseUrl.replaceAll("/$", "");
	}

	@Override
	public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
			Authentication authentication) throws IOException, ServletException {
		OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
		Map<String, Object> attributes = oauth2User.getAttributes();

		String provider = "google";
		String providerId = getAttribute(attributes, "sub");
		String email = getAttribute(attributes, "email");
		String name = getAttribute(attributes, "name");
		String picture = getAttribute(attributes, "picture");

		if (providerId == null || providerId.isEmpty()) {
			providerId = getAttribute(attributes, "id");
		}
		if (email == null || email.isEmpty()) {
			email = getAttribute(attributes, "email");
		}

		if (providerId == null || email == null || email.isEmpty()) {
			response.sendRedirect(frontendBaseUrl + "/login?error=" +
				java.net.URLEncoder.encode("oauth_missing_data", "UTF-8"));
			return;
		}

		try {
			var tokenPair = authService.processOAuth2UserWithRefresh(provider, providerId, email, name, picture);
			// Store token pair and redirect with short-lived one-time code instead of real JWT.
			// The frontend exchanges this code for the real tokens via POST /api/auth/exchange-oauth-code.
			String code = oauthCodeStore.storeTokenPair(tokenPair);
			response.sendRedirect(frontendBaseUrl + "/oauth-callback?code=" +
				java.net.URLEncoder.encode(code, "UTF-8"));
		} catch (Exception e) {
			response.sendRedirect(frontendBaseUrl + "/login?error=" +
				java.net.URLEncoder.encode(e.getMessage(), "UTF-8"));
		}
	}

	private String getAttribute(Map<String, Object> attributes, String key) {
		Object val = attributes.get(key);
		return val != null ? val.toString() : null;
	}
}
