<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
include("../../connect.php");
$response = array();
if (isset($_POST['distributor_id'])) {
	$ver = $_POST['distributor_id'];
	$select_request = mysqli_query($con, "select request_id,party_id,transaction_date,transaction_time,total_amount from tbl_distributor_pop_request where distributor_id='$ver'");
	$product = array();
	while ($fetch_purchase_request = mysqli_fetch_array($select_request)) {
		$request_id = $fetch_purchase_request['request_id'];
		$product['party_id'] = $fetch_purchase_request['party_id'];
		$product['transaction_date'] = $fetch_purchase_request['transaction_date'];
		$product['transaction_time'] = $fetch_purchase_request['transaction_time'];
		$product['total_amount'] = $fetch_purchase_request['total_amount'];
		// $product['company_status'] = $fetch_purchase_request['company_status'];
		// $product['comp_updation_datetime'] = $fetch_purchase_request['comp_updation_datetime'];
		$product['pop_request_details'] = array();

		$select_details = mysqli_query($con, "select product_id,request_qty,updated_qty,request_price,updated_price from tbl_distributor_pop_request_detail where request_id='$request_id'");

		while ($fetch_purchase_request2 = mysqli_fetch_array($select_details)) {
			$product2['product_id'] = $fetch_purchase_request2['product_id'];
			$product2['request_qty'] = $fetch_purchase_request2['request_qty'];
			$product2['updated_qty'] = $fetch_purchase_request2['updated_qty'];
			$product2['request_price'] = $fetch_purchase_request2['request_price'];
			$product2['updated_price'] = $fetch_purchase_request2['updated_price'];
			$product['pop_request_details'][] = $product2;
		}
		$response['pop_request'][] = $product;
	}
	$response['success'] = '1';
	$response['details'] = "Fetch Detail Successful";
} else {
	$response['success'] = '0';
	$response['details'] = "Required field missing";
}
echo json_encode($response);
?>