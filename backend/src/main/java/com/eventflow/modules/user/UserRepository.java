package com.eventflow.modules.user;

import com.eventflow.common.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);

    Optional<User> findByEmailVerifyToken(String emailVerifyToken);

    Optional<User> findByPasswordResetToken(String passwordResetToken);

    boolean existsByEmail(String email);

    Page<User> findByRole(UserRole role, Pageable pageable);
}
