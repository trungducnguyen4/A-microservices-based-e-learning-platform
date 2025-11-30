package org.tduc.userservice.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.GenericGenerator;

import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User {

    @Id
    @GeneratedValue(generator = "uuid")
    @GenericGenerator(name = "uuid", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(length = 36, updatable = false, nullable = false)
    String id;

    @Column(name = "username", nullable = false, unique = true)
    String username;

    // Map to the existing DB column 'password_hash'
    @Column(name = "password_hash", nullable = false)
    String passwordHash;

    // transient password field used during creation (not persisted) - helps DTO->entity mapping
    @Transient
    String password;

    @Column(name = "email", nullable = false, unique = true)
    String email;
    @Column(name = "first_name")
    String firstName;

    @Column(name = "last_name")
    String lastName;
    // If your DB uses a single full_name column, map to it. If your DB has first_name/last_name,
    // you can split fields or update the table. Mapping to full_name matches existing inserts.
    @Column(name = "full_name")
    String fullName;

    @Column(name = "enabled")
    boolean enabled = true;

    @Column(name = "role")
    String role;
}