<?php
include("../../connect.php");
$response = array();
if (isset($_POST['distributor_id'])) {
	$response['tcs_tds_percentage'] = 0;
	$dis_id = $_POST['distributor_id'];
	$select_order = mysqli_query($con, "select * from `tbl_sequence` where distributor_id='$dis_id'");
	if (mysqli_num_rows($select_order) > 0) {
		$select_row =  mysqli_fetch_assoc($select_order);
		$response['credit_note_sequence'] = $select_row['credit_sequence'];
	} else {
		$response['credit_note_sequence'] = '';
	}
	$select_tcstds = mysqli_query($con, "select * from tbl_bthawk_tcs_tds_details");
	if (mysqli_num_rows($select_tcstds) > 0) {
		$fetch_tcstds = mysqli_fetch_array($select_tcstds);
		$response['tcs_tds_percentage'] = $fetch_tcstds['value'];
	}
	$select_product = mysqli_query($con, "SELECT tbl_party.party_name,tbl_party.party_phone,tbl_party.place_of_supply,tbl_party.party_id FROM tbl_party,tbl_party_user where tbl_party.party_id=tbl_party_user.party_id and tbl_party.status='Active' and tbl_party.distributor_id='$dis_id'");
	if (mysqli_num_rows($select_product) > 0) {
		$product = array();
		while ($fetch_product = mysqli_fetch_array($select_product)) {
			$product['party_id'] = $fetch_product['party_id'];
			$product['party_name'] = $fetch_product['party_name'];
			$product['party_phone'] = $fetch_product['party_phone'];
			$product['place_of_supply'] = $fetch_product['place_of_supply'];
			$response['parties'][] = $product;
		}
	} else {
		$response['success'] = '0';
		$response['details'] = "No Party Available";
	}
} else {
	$response['success'] = '0';
	$response['details'] = "Required field missing";
}
echo json_encode($response);
