package com.figurestore.service.impl;

import com.figurestore.dto.request.AddressRequest;
import com.figurestore.dto.response.AddressResponse;
import com.figurestore.entity.Address;
import com.figurestore.entity.User;
import com.figurestore.exception.AppException;
import com.figurestore.repository.AddressRepository;
import com.figurestore.repository.UserRepository;
import com.figurestore.service.interfaces.AddressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AddressServiceImpl implements AddressService {

 private final AddressRepository addressRepository;
 private final UserRepository userRepository;

 @Override
 @Transactional(readOnly = true)
 public List<AddressResponse> getAll(String email) {
  return addressRepository
          .findAllByUserEmailIgnoreCaseOrderByDefaultAddressDescCreatedAtDesc(email)
          .stream()
          .map(this::mapToResponse)
          .toList();
 }

 @Override
 @Transactional
 public AddressResponse create(
         String email,
         AddressRequest request
 ) {
  User user = userRepository
          .findByEmailIgnoreCase(email)
          .orElseThrow(() -> new AppException(
                  HttpStatus.NOT_FOUND,
                  "Không tìm thấy tài khoản"
          ));

  boolean isDefaultAddress =
          request.defaultAddress()
                  || addressRepository.countByUserEmailIgnoreCase(email) == 0;

  if (isDefaultAddress) {
   clearDefaultAddress(email);
  }

  Address address = Address.builder()
          .user(user)
          .label(request.label().trim())
          .recipientName(request.recipientName().trim())
          .phone(request.phone().trim())
          .province(request.province().trim())
          .district(
                  normalizeOptionalText(
                          request.district()
                  )
          )
          .ward(request.ward().trim())
          .detailAddress(request.detailAddress().trim())
          .defaultAddress(isDefaultAddress)
          .build();

  Address savedAddress = addressRepository.save(address);

  return mapToResponse(savedAddress);
 }

 @Override
 @Transactional
 public AddressResponse update(
         String email,
         Long id,
         AddressRequest request
 ) {
  Address address = getAddress(email, id);

  /*
   * Nếu địa chỉ hiện tại đang là mặc định
   * thì không cho bỏ mặc định trực tiếp.
   *
   * Khi một địa chỉ khác được đặt làm mặc định,
   * clearDefaultAddress() sẽ bỏ mặc định của địa chỉ này.
   */
  boolean willBeDefault =
          request.defaultAddress()
                  || Boolean.TRUE.equals(address.getDefaultAddress());

  if (request.defaultAddress()) {
   clearDefaultAddress(email);
  }

  address.setLabel(request.label().trim());
  address.setRecipientName(request.recipientName().trim());
  address.setPhone(request.phone().trim());
  address.setProvince(request.province().trim());

  address.setDistrict(
          normalizeOptionalText(
                  request.district()
          )
  );

  address.setWard(request.ward().trim());
  address.setDetailAddress(request.detailAddress().trim());
  address.setDefaultAddress(willBeDefault);

  Address savedAddress = addressRepository.save(address);

  return mapToResponse(savedAddress);
 }

 @Override
 @Transactional
 public void delete(
         String email,
         Long id
 ) {
  Address address = getAddress(email, id);

  boolean wasDefaultAddress =
          Boolean.TRUE.equals(address.getDefaultAddress());

  addressRepository.delete(address);
  addressRepository.flush();

  /*
   * Nếu xóa địa chỉ mặc định,
   * lấy địa chỉ còn lại mới nhất làm mặc định.
   */
  if (wasDefaultAddress) {
   addressRepository
           .findAllByUserEmailIgnoreCaseOrderByDefaultAddressDescCreatedAtDesc(
                   email
           )
           .stream()
           .findFirst()
           .ifPresent(nextAddress -> {
            nextAddress.setDefaultAddress(true);
            addressRepository.save(nextAddress);
           });
  }
 }

 private Address getAddress(
         String email,
         Long id
 ) {
  return addressRepository
          .findByIdAndUserEmailIgnoreCase(id, email)
          .orElseThrow(() -> new AppException(
                  HttpStatus.NOT_FOUND,
                  "Không tìm thấy địa chỉ"
          ));
 }

 private void clearDefaultAddress(String email) {
  List<Address> addresses =
          addressRepository
                  .findAllByUserEmailIgnoreCaseOrderByDefaultAddressDescCreatedAtDesc(
                          email
                  );

  addresses.forEach(address ->
          address.setDefaultAddress(false)
  );

  addressRepository.saveAll(addresses);
 }

 private String normalizeOptionalText(String value) {
  if (value == null) {
   return null;
  }

  String normalized = value.trim();

  return normalized.isEmpty()
          ? null
          : normalized;
 }

 private AddressResponse mapToResponse(Address address) {
  return new AddressResponse(
          address.getId(),
          address.getLabel(),
          address.getRecipientName(),
          address.getPhone(),
          address.getProvince(),
          address.getDistrict(),
          address.getWard(),
          address.getDetailAddress(),
          Boolean.TRUE.equals(address.getDefaultAddress())
  );
 }
}