package com.figurestore.entity;

import com.figurestore.enums.OrderStatus;
import com.figurestore.enums.PaymentMethod;
import com.figurestore.enums.PaymentStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "orders",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_orders_code",
                        columnNames = "order_code"
                )
        },
        indexes = {
                @Index(
                        name = "idx_orders_user",
                        columnList = "user_id"
                ),
                @Index(
                        name = "idx_orders_status",
                        columnList = "status"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

 @Id
 @GeneratedValue(strategy = GenerationType.IDENTITY)
 private Long id;

 @Column(
         name = "order_code",
         nullable = false,
         length = 30
 )
 private String orderCode;

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
         name = "recipient_name",
         nullable = false,
         length = 100
 )
 private String recipientName;

 @Column(
         name = "recipient_phone",
         nullable = false,
         length = 20
 )
 private String recipientPhone;

 @Column(
         name = "shipping_address",
         nullable = false,
         length = 700
 )
 private String shippingAddress;

 @Column(columnDefinition = "TEXT")
 private String note;

 @Column(
         name = "subtotal",
         nullable = false,
         precision = 15,
         scale = 2
 )
 private BigDecimal subtotal;

 @Column(
         name = "shipping_fee",
         nullable = false,
         precision = 15,
         scale = 2
 )
 private BigDecimal shippingFee;

 @Column(
         name = "total_amount",
         nullable = false,
         precision = 15,
         scale = 2
 )
 private BigDecimal totalAmount;

 @Enumerated(EnumType.STRING)
 @Column(
         nullable = false,
         length = 30
 )
 private OrderStatus status;

 @Enumerated(EnumType.STRING)
 @Column(
         name = "payment_method",
         nullable = false,
         length = 20
 )
 private PaymentMethod paymentMethod;

 @Enumerated(EnumType.STRING)
 @Column(
         name = "payment_status",
         nullable = false,
         length = 20
 )
 private PaymentStatus paymentStatus;

 @Column(name = "paid_at")
 private LocalDateTime paidAt;

 @Column(name = "confirmed_at")
 private LocalDateTime confirmedAt;

 @Column(name = "shipping_at")
 private LocalDateTime shippingAt;

 @Column(name = "delivered_at")
 private LocalDateTime deliveredAt;

 @Column(name = "cancelled_at")
 private LocalDateTime cancelledAt;

 @Column(
         name = "cancel_reason",
         length = 500
 )
 private String cancelReason;

 @OneToMany(
         mappedBy = "order",
         cascade = CascadeType.ALL,
         orphanRemoval = true
 )
 @Builder.Default
 private List<OrderItem> items = new ArrayList<>();

 @OneToMany(
         mappedBy = "order",
         cascade = CascadeType.ALL,
         orphanRemoval = true
 )
 @Builder.Default
 private List<PaymentTransaction> payments = new ArrayList<>();

 @Column(
         name = "created_at",
         nullable = false
 )
 private LocalDateTime createdAt;

 @Column(
         name = "updated_at",
         nullable = false
 )
 private LocalDateTime updatedAt;

 public void addItem(OrderItem orderItem) {
  items.add(orderItem);
  orderItem.setOrder(this);
 }

 public void addPayment(PaymentTransaction paymentTransaction) {
  payments.add(paymentTransaction);
  paymentTransaction.setOrder(this);
 }

 @PrePersist
 protected void onCreate() {
  LocalDateTime now = LocalDateTime.now();

  createdAt = now;
  updatedAt = now;
 }

 @PreUpdate
 protected void onUpdate() {
  updatedAt = LocalDateTime.now();
 }
}