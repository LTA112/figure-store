package com.figurestore.service.impl;

import com.figurestore.dto.request.AddCartItemRequest;
import com.figurestore.dto.request.MergeCartRequest;
import com.figurestore.dto.request.UpdateCartItemRequest;
import com.figurestore.dto.response.CartResponse;
import com.figurestore.entity.Cart;
import com.figurestore.entity.CartItem;
import com.figurestore.entity.Product;
import com.figurestore.entity.User;
import com.figurestore.enums.ProductStatus;
import com.figurestore.exception.AppException;
import com.figurestore.repository.CartItemRepository;
import com.figurestore.repository.CartRepository;
import com.figurestore.repository.ProductRepository;
import com.figurestore.repository.UserRepository;
import com.figurestore.service.interfaces.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CartServiceImpl
        implements CartService {

    private final CartRepository cartRepository;

    private final CartItemRepository
            cartItemRepository;

    private final ProductRepository
            productRepository;

    private final UserRepository
            userRepository;

    @Override
    @Transactional(readOnly = true)
    public CartResponse getCart(
            String email
    ) {
        return cartRepository
                .findByUserEmailIgnoreCase(
                        email
                )
                .map(
                        CartResponse::fromEntity
                )
                .orElseGet(
                        CartResponse::empty
                );
    }

    @Override
    @Transactional
    public CartResponse addItem(
            String email,
            AddCartItemRequest request
    ) {
        User user =
                findUser(email);

        Product product =
                findPurchasableProduct(
                        request.getProductId()
                );

        int requestedQuantity =
                request.getQuantity();

        validateStock(
                product,
                requestedQuantity
        );

        Cart cart =
                getOrCreateCart(user);

        addOrIncreaseCartItem(
                cart,
                product,
                requestedQuantity
        );

        return getUpdatedCartResponse(
                cart.getId()
        );
    }

    /*
     * Nhận các sản phẩm đang lưu trong localStorage
     * của guest và thêm vào giỏ hàng của user.
     */
    @Override
    @Transactional
    public CartResponse mergeCart(
            String email,
            MergeCartRequest request
    ) {
        User user =
                findUser(email);

        Cart cart =
                getOrCreateCart(user);

        for (
                AddCartItemRequest guestItem
                : request.getItems()
        ) {
            Product product =
                    findPurchasableProduct(
                            guestItem.getProductId()
                    );

            Integer guestQuantity =
                    guestItem.getQuantity();

            validateStock(
                    product,
                    guestQuantity
            );

            addOrIncreaseCartItem(
                    cart,
                    product,
                    guestQuantity
            );
        }

        return getUpdatedCartResponse(
                cart.getId()
        );
    }

    @Override
    @Transactional
    public CartResponse updateItem(
            String email,
            Long itemId,
            UpdateCartItemRequest request
    ) {
        CartItem item =
                cartItemRepository
                        .findByIdAndCartUserEmailIgnoreCase(
                                itemId,
                                email
                        )
                        .orElseThrow(() ->
                                new AppException(
                                        HttpStatus.NOT_FOUND,
                                        "Không tìm thấy sản phẩm trong giỏ hàng"
                                )
                        );

        Product product =
                item.getProduct();

        validatePurchasable(product);

        validateStock(
                product,
                request.getQuantity()
        );

        item.setQuantity(
                request.getQuantity()
        );

        cartItemRepository.save(item);

        return getUpdatedCartResponse(
                item.getCart().getId()
        );
    }

    @Override
    @Transactional
    public CartResponse removeItem(
            String email,
            Long itemId
    ) {
        CartItem item =
                cartItemRepository
                        .findByIdAndCartUserEmailIgnoreCase(
                                itemId,
                                email
                        )
                        .orElseThrow(() ->
                                new AppException(
                                        HttpStatus.NOT_FOUND,
                                        "Không tìm thấy sản phẩm trong giỏ hàng"
                                )
                        );

        Cart cart =
                item.getCart();

        cart.removeItem(item);

        cartItemRepository.delete(item);

        cartItemRepository.flush();

        return getUpdatedCartResponse(
                cart.getId()
        );
    }

    @Override
    @Transactional
    public void clearCart(
            String email
    ) {
        Cart cart =
                cartRepository
                        .findByUserEmailIgnoreCase(
                                email
                        )
                        .orElse(null);

        if (cart == null) {
            return;
        }

        cart.getItems().clear();

        cartRepository.save(cart);
    }

    /*
     * Thêm sản phẩm mới hoặc cộng số lượng
     * nếu sản phẩm đã có trong giỏ.
     */
    private void addOrIncreaseCartItem(
            Cart cart,
            Product product,
            Integer quantity
    ) {
        CartItem existingItem =
                cartItemRepository
                        .findByCartIdAndProductId(
                                cart.getId(),
                                product.getId()
                        )
                        .orElse(null);

        if (existingItem != null) {
            int newQuantity =
                    existingItem.getQuantity()
                            + quantity;

            validateStock(
                    product,
                    newQuantity
            );

            existingItem.setQuantity(
                    newQuantity
            );

            cartItemRepository.save(
                    existingItem
            );

            return;
        }

        validateStock(
                product,
                quantity
        );

        CartItem newItem =
                CartItem.builder()
                        .cart(cart)
                        .product(product)
                        .quantity(quantity)
                        .build();

        cart.addItem(newItem);

        cartItemRepository.save(
                newItem
        );
    }

    private CartResponse getUpdatedCartResponse(
            Long cartId
    ) {
        cartItemRepository.flush();

        Cart updatedCart =
                cartRepository
                        .findById(cartId)
                        .orElseThrow(() ->
                                new AppException(
                                        HttpStatus.NOT_FOUND,
                                        "Không tìm thấy giỏ hàng"
                                )
                        );

        return CartResponse.fromEntity(
                updatedCart
        );
    }

    private User findUser(
            String email
    ) {
        return userRepository
                .findByEmailIgnoreCase(
                        email
                )
                .orElseThrow(() ->
                        new AppException(
                                HttpStatus.NOT_FOUND,
                                "Không tìm thấy tài khoản"
                        )
                );
    }

    private Cart getOrCreateCart(
            User user
    ) {
        return cartRepository
                .findByUserId(
                        user.getId()
                )
                .orElseGet(() ->
                        cartRepository.save(
                                Cart.builder()
                                        .user(user)
                                        .build()
                        )
                );
    }

    private Product findPurchasableProduct(
            Long productId
    ) {
        Product product =
                productRepository
                        .findById(productId)
                        .orElseThrow(() ->
                                new AppException(
                                        HttpStatus.NOT_FOUND,
                                        "Không tìm thấy sản phẩm"
                                )
                        );

        validatePurchasable(product);

        return product;
    }

    private void validatePurchasable(
            Product product
    ) {
        if (
                product.getStatus()
                        == ProductStatus.INACTIVE
        ) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "Sản phẩm hiện không được bán"
            );
        }

        if (
                product.getStatus()
                        == ProductStatus.OUT_OF_STOCK
                        || product.getStockQuantity()
                        == null
                        || product.getStockQuantity()
                        <= 0
        ) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "Sản phẩm đã hết hàng"
            );
        }
    }

    private void validateStock(
            Product product,
            Integer quantity
    ) {
        if (
                quantity == null
                        || quantity < 1
        ) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "Số lượng tối thiểu là 1"
            );
        }

        if (
                quantity
                        > product.getStockQuantity()
        ) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "Số lượng sản phẩm trong kho chỉ còn "
                            + product.getStockQuantity()
            );
        }
    }
}