package com.eventflow.config;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Profile("hosted-demo")
@Controller
public class HostedFrontendController {
    static final String[] PUBLIC_PATHS = {
            "/", "/index.html", "/assets/**", "/editorial/**", "/eventflow.svg",
            "/events", "/events/**", "/login", "/register", "/unauthorized",
            "/checkout/**", "/booking/**", "/dashboard", "/my-bookings", "/profile",
            "/organizer", "/organizer/**", "/venue", "/venue/**", "/admin", "/admin/**"
    };

    @GetMapping({
            "/", "/events", "/events/**", "/login", "/register", "/unauthorized",
            "/checkout/**", "/booking/**", "/dashboard", "/my-bookings", "/profile",
            "/organizer", "/organizer/**", "/venue", "/venue/**", "/admin", "/admin/**"
    })
    public String frontend() {
        return "forward:/index.html";
    }
}
