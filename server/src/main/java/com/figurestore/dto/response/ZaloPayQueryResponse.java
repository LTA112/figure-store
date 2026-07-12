package com.figurestore.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ZaloPayQueryResponse(

        @JsonProperty("return_code")
        Integer returnCode,

        @JsonProperty("return_message")
        String returnMessage,

        @JsonProperty("sub_return_code")
        Integer subReturnCode,

        @JsonProperty("sub_return_message")
        String subReturnMessage,

        @JsonProperty("is_processing")
        Boolean processing,

        Long amount,

        @JsonProperty("zp_trans_id")
        Long zpTransId,

        @JsonProperty("server_time")
        Long serverTime,

        @JsonProperty("discount_amount")
        Long discountAmount

) {
}