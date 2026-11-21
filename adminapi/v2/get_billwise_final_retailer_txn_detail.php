<?php
include("../../../connect.php");

$response = array();
if (isset($_POST['transaction_id']) && isset($_POST['distributor_user_id']) &&  isset($_POST['distributor_id'])) {
    $dis_uid = $_POST['distributor_user_id'];
    date_default_timezone_set('Asia/Calcutta');
    $clientIP = $_SERVER['REMOTE_ADDR'];
    $apiUrl = "http://ipinfo.io/{$clientIP}/json";
    $response1 = file_get_contents($apiUrl);
    $details = json_decode($response1, true);
    if ($details['country'] == 'AE') {
        date_default_timezone_set('Asia/Dubai');
    }
    $da  = date("Y-m-d");
    $select_user = mysqli_query($con, "SELECT imei_no,session_id FROM tbl_distributor_users where status='Active' and distributor_user_id='$dis_uid'");
    if (mysqli_num_rows($select_user) > 0) {
        while ($fetch_user = mysqli_fetch_array($select_user)) {
            $response['user_status'] = '1';
            $response['user_imei'] = $fetch_user['imei_no'];
            $response['session_id'] = $fetch_user['session_id'];
        }
    } else {
        $response['user_status'] = '0';
        $response['session_id'] = '';
        $response['user_imei'] = '';
    }
    $txnid = $_POST['transaction_id'];
    $ver = $_POST['distributor_id'];
    $flagfinal = 0;
    $queryres = "SELECT *,tbl_party_transaction.source as finalbillsource from tbl_party_transaction,tbl_party,tbl_user where tbl_party_transaction.transaction_to = tbl_party.party_id and tbl_party_transaction.transaction_from=tbl_user.user_id and tbl_party_transaction.transaction_id='$txnid' and tbl_user.distributor_id='$ver'";
    $res = mysqli_query($con, $queryres);
    $billbook = array();
    $termsConditionArr = array();
    $total_gst_amount = 0;

    // terms&conditions
    $getTermsConditions = mysqli_query($con, "SELECT * FROM `tbl_dist_terms_conditions` WHERE distributor_id = '$ver'");

    $value = mysqli_num_rows($getTermsConditions) > 0 ? mysqli_fetch_assoc($getTermsConditions) : [];

    for ($i = 1; $i <= 7; $i++) {
        $response["terms$i"] = $value["terms_condition$i"] ?? '';
    }


    if (mysqli_num_rows($res) > 0) {
        $flagfinal = 1;
        while ($fetch_product = mysqli_fetch_assoc($res)) {
            $transaction_id = $fetch_product['transaction_id'];

            // client firm details
            $getUserDetails = mysqli_query($con, "SELECT * FROM `tbl_distributor` WHERE distributor_id = '$ver'");
            $fetchUserDetails = mysqli_fetch_assoc($getUserDetails);

            $billbook['invoice_number'] = $fetch_product['transaction_bill_number'];
            $billbook['payment_mode'] = $fetch_product['payment_mode'];
            $billbook['party_name'] = $fetch_product['party_name'];
            $billbook['party_phone'] = $fetch_product['party_phone'];
            $billbook['party_gstin'] = $fetch_product['party_gstin'];
            $billbook['transaction_date'] = $fetch_product['transaction_date'];
            $billbook['transaction_time'] = $fetch_product['transaction_time'];
            $billbook['total_amount'] = $fetch_product['total_amount'];
            $billbook['disc_amt'] = $fetch_product['disc_amt'];
            $billbook['labour_charges'] = $fetch_product['labour_charges'];
            $billbook['freight_charges'] = $fetch_product['freight_charges'];
            $billbook['other_expenses'] = $fetch_product['other_expenses'];
            $billbook['round_off_amt'] = $fetch_product['round_off_amt'];
            $billbook['final_amount'] = $fetch_product['final_amt'];
            $billbook['invoice_type'] = $fetch_product['bill_type'];
            $billbook['firm_name'] = !empty($fetchUserDetails['firm_name']) ? $fetchUserDetails['firm_name'] : $fetchUserDetails['distributor_name'];
            $billbook['firm_address'] = $fetchUserDetails['distributor_address'];
            $billbook['firm_email'] = $fetchUserDetails['distributor_email'];
            $billbook['firm_gstin'] = $fetchUserDetails['gstin_no'];
            $billbook['firm_phone_no'] = $fetchUserDetails['phone_no'];

            $check_product_type = '';
            $res_test_product = mysqli_query($con, "SELECT * from  tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id=tbl_product.product_id and tbl_party_transaction_detail.transaction_id='$transaction_id' order by tbl_party_transaction_detail.transaction_detail_id asc limit 1");
            while ($fetch_test_product = mysqli_fetch_assoc($res_test_product)) {
                $check_product_type = $fetch_test_product['product_type'];
            }

            $billbook['bill_product_detail'] = array();
            $proidval = $fetch_product['product_id'];
            $res_consumedetail = mysqli_query($con, "SELECT *,tbl_party_transaction_detail.product_price as pro_price from tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id = tbl_product.product_id and tbl_party_transaction_detail.transaction_id='$transaction_id'");
            if (mysqli_num_rows($res_consumedetail) > 0) {
                while ($fetch_consume = mysqli_fetch_assoc($res_consumedetail)) {

                    $bill_product_detail['product_name'] = $fetch_consume['product_name'];
                    $bill_product_detail['quantity'] = $fetch_consume['quantity'];
                    $bill_product_detail['sale_unit'] = $fetch_consume['sale_unit'];
                    $bill_product_detail['product_disc'] = $fetch_consume['product_disc'];
                    $bill_product_detail['product_price'] = $fetch_consume['quantity'] * $fetch_consume['pro_price'];

                    $total_gst_amount = $fetch_consume['CGST_amount'] + $fetch_consume['SGST_amount'] + $fetch_consume['IGST_amount'];
                    $gst_amount += $total_gst_amount;
                    $bill_product_detail['total_gst_amount'] = round($total_gst_amount, 2);

                    $billbook['bill_product_detail'][] = $bill_product_detail;
                }
            } else {
                $billbook['bill_product_detail'] = $bill_product_detail;
            }

            $billbook['gst_amount'] = round($gst_amount, 2);
            $response['billbook'][] = $billbook;
        }
    }
    if ($flagfinal == 1) {
        $response['success'] = '1';
        $response['message'] = "Fetch Detail Successful";
    } else {
        $response['success'] = '0';
        $response['message'] = "Bill not available";
    }
} else {
    $response['success'] = '0';
    $response['details'] = "Required field missing";
}
echo json_encode($response);
