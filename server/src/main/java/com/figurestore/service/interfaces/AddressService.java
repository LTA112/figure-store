package com.figurestore.service.interfaces;

import com.figurestore.dto.request.AddressRequest;
import com.figurestore.dto.response.AddressResponse;

import java.util.List;

public interface AddressService {

    List<AddressResponse> getAll(String email);

    AddressResponse create(
            String email,
            AddressRequest request
    );

    AddressResponse update(
            String email,
            Long id,
            AddressRequest request
    );

    void delete(
            String email,
            Long id
    );
}