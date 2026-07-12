package com.figurestore.controller;

import com.figurestore.dto.request.AddressRequest;
import com.figurestore.dto.response.*;
import com.figurestore.service.interfaces.AddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AddressResponse>>> all(Authentication a) {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy địa chỉ thành công", service.getAll(a.getName())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AddressResponse>> create(Authentication a,
                                                               @Valid @RequestBody AddressRequest r) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo địa chỉ thành công", service.create(a.getName(), r)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AddressResponse>> update(Authentication a,
                                                               @PathVariable Long id,
                                                               @Valid @RequestBody AddressRequest r) {
        return ResponseEntity.ok(
                ApiResponse.success("Cập nhật địa chỉ thành công", service.update(a.getName(), id, r)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(Authentication a, @PathVariable Long id) {
        service.delete(a.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Xóa địa chỉ thành công", null));
    }
}