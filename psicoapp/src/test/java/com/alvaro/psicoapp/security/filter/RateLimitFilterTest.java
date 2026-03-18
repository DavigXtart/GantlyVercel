package com.alvaro.psicoapp.security.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RateLimitFilterTest {

    private RateLimitFilter rateLimitFilter;

    @Mock
    private FilterChain filterChain;

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        rateLimitFilter = new RateLimitFilter();
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
    }

    // ── Normal request passes through ───────────────────────────────────

    @Test
    @DisplayName("Normal request passes through filter chain")
    void normalRequest_passesThrough() throws ServletException, IOException {
        request.setRemoteAddr("10.0.0.1");
        request.setRequestURI("/api/profile/me");

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertEquals(200, response.getStatus());
        assertEquals("60", response.getHeader("X-RateLimit-Limit"));
        assertEquals("59", response.getHeader("X-RateLimit-Remaining"));
    }

    @Test
    @DisplayName("Normal request sets rate limit headers correctly")
    void normalRequest_setsHeaders() throws ServletException, IOException {
        request.setRemoteAddr("10.0.0.2");
        request.setRequestURI("/api/tasks");

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        assertNotNull(response.getHeader("X-RateLimit-Limit"));
        assertNotNull(response.getHeader("X-RateLimit-Remaining"));
    }

    // ── Per-endpoint limit ──────────────────────────────────────────────

    @Test
    @DisplayName("Exceeding per-endpoint limit returns 429")
    void exceedPerEndpointLimit_returns429() throws ServletException, IOException {
        String uniqueIp = "10.1.0.1";

        // Send 60 requests (the limit for non-auth endpoints)
        for (int i = 0; i < 60; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest();
            MockHttpServletResponse res = new MockHttpServletResponse();
            req.setRemoteAddr(uniqueIp);
            req.setRequestURI("/api/specific-endpoint");
            rateLimitFilter.doFilterInternal(req, res, filterChain);
            assertEquals(200, res.getStatus(), "Request " + (i + 1) + " should pass");
        }

        // The 61st request should be blocked
        MockHttpServletRequest blockedReq = new MockHttpServletRequest();
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();
        blockedReq.setRemoteAddr(uniqueIp);
        blockedReq.setRequestURI("/api/specific-endpoint");

        rateLimitFilter.doFilterInternal(blockedReq, blockedRes, filterChain);

        assertEquals(429, blockedRes.getStatus());
        assertTrue(blockedRes.getContentAsString().contains("Demasiadas peticiones"));
    }

    // ── Global IP limit ─────────────────────────────────────────────────

    @Test
    @DisplayName("Exceeding global IP limit returns 429")
    void exceedGlobalIpLimit_returns429() throws ServletException, IOException {
        String uniqueIp = "10.2.0.1";

        // Send 300 requests across different endpoints to avoid per-endpoint limit
        for (int i = 0; i < 300; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest();
            MockHttpServletResponse res = new MockHttpServletResponse();
            req.setRemoteAddr(uniqueIp);
            req.setRequestURI("/api/endpoint-" + i);
            rateLimitFilter.doFilterInternal(req, res, filterChain);
            assertEquals(200, res.getStatus(), "Request " + (i + 1) + " should pass");
        }

        // The 301st request should be blocked by global limit
        MockHttpServletRequest blockedReq = new MockHttpServletRequest();
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();
        blockedReq.setRemoteAddr(uniqueIp);
        blockedReq.setRequestURI("/api/endpoint-300");

        rateLimitFilter.doFilterInternal(blockedReq, blockedRes, filterChain);

        assertEquals(429, blockedRes.getStatus());
        assertTrue(blockedRes.getContentAsString().contains("Demasiadas peticiones"));
    }

    // ── Auth endpoints have lower limits ────────────────────────────────

    @Test
    @DisplayName("Sensitive auth endpoints (login/register) have rate limit of 5")
    void sensitiveEndpoints_lowerLimit() throws ServletException, IOException {
        String uniqueIp = "10.3.0.1";

        // Send 5 requests to login endpoint (the sensitive limit)
        for (int i = 0; i < 5; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest();
            MockHttpServletResponse res = new MockHttpServletResponse();
            req.setRemoteAddr(uniqueIp);
            req.setRequestURI("/api/auth/login");
            rateLimitFilter.doFilterInternal(req, res, filterChain);
            assertEquals(200, res.getStatus(), "Sensitive request " + (i + 1) + " should pass");
        }

        // The 6th request should be blocked
        MockHttpServletRequest blockedReq = new MockHttpServletRequest();
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();
        blockedReq.setRemoteAddr(uniqueIp);
        blockedReq.setRequestURI("/api/auth/login");

        rateLimitFilter.doFilterInternal(blockedReq, blockedRes, filterChain);

        assertEquals(429, blockedRes.getStatus());
    }

    @Test
    @DisplayName("Sensitive endpoints report limit as 5 in headers")
    void sensitiveEndpoints_headerShowsLimit() throws ServletException, IOException {
        request.setRemoteAddr("10.4.0.1");
        request.setRequestURI("/api/auth/register");

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        assertEquals("5", response.getHeader("X-RateLimit-Limit"));
        assertEquals("4", response.getHeader("X-RateLimit-Remaining"));
    }

    @Test
    @DisplayName("Different IPs have independent rate limits")
    void differentIps_independentLimits() throws ServletException, IOException {
        // Fill up the limit for IP-A on a specific endpoint
        for (int i = 0; i < 60; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest();
            MockHttpServletResponse res = new MockHttpServletResponse();
            req.setRemoteAddr("10.5.0.1");
            req.setRequestURI("/api/shared-endpoint");
            rateLimitFilter.doFilterInternal(req, res, filterChain);
        }

        // IP-B should still be able to reach the same endpoint
        MockHttpServletRequest reqB = new MockHttpServletRequest();
        MockHttpServletResponse resB = new MockHttpServletResponse();
        reqB.setRemoteAddr("10.5.0.2");
        reqB.setRequestURI("/api/shared-endpoint");

        rateLimitFilter.doFilterInternal(reqB, resB, filterChain);

        assertEquals(200, resB.getStatus());
        verify(filterChain, atLeastOnce()).doFilter(reqB, resB);
    }

    @Test
    @DisplayName("X-Forwarded-For header is used for client IP detection")
    void xForwardedFor_usedForIp() throws ServletException, IOException {
        request.setRemoteAddr("127.0.0.1");
        request.addHeader("X-Forwarded-For", "203.0.113.50, 70.41.3.18");
        request.setRequestURI("/api/test");

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertEquals(200, response.getStatus());
    }
}
