package com.figurestore.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "addresses",
        indexes = {
                @Index(
                        name = "idx_addresses_user",
                        columnList = "user_id"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Address {

 @Id
 @GeneratedValue(strategy = GenerationType.IDENTITY)
 private Long id;

 @ManyToOne(
         fetch = FetchType.LAZY,
         optional = false
 )
 @JoinColumn(
         name = "user_id",
         nullable = false
 )
 private User user;

 @Column(
         nullable = false,
         length = 100
 )
 private String label;

 @Column(
         name = "recipient_name",
         nullable = false,
         length = 100
 )
 private String recipientName;

 @Column(
         nullable = false,
         length = 20
 )
 private String phone;

 @Column(
         nullable = false,
         length = 120
 )
 private String province;

 @Column(
         nullable = true,
         length = 120
 )
 private String district;

 @Column(
         nullable = false,
         length = 120
 )
 private String ward;

 @Column(
         name = "detail_address",
         nullable = false,
         length = 255
 )
 private String detailAddress;

 @Column(
         name = "is_default",
         nullable = false
 )
 @Builder.Default
 private Boolean defaultAddress = false;

 @Column(
         name = "created_at",
         nullable = false,
         updatable = false
 )
 private LocalDateTime createdAt;

 @Column(
         name = "updated_at",
         nullable = false
 )
 private LocalDateTime updatedAt;

 @PrePersist
 protected void onCreate() {
  LocalDateTime now = LocalDateTime.now();

  createdAt = now;
  updatedAt = now;

  if (defaultAddress == null) {
   defaultAddress = false;
  }
 }

 @PreUpdate
 protected void onUpdate() {
  updatedAt = LocalDateTime.now();

  if (defaultAddress == null) {
   defaultAddress = false;
  }
 }
}