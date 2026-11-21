<?php
include("../../connect.php");
$response = array();
if (isset($_POST['distributor_id']) && isset($_POST['distributor_user_id'])) {
	$dis_uid = $_POST['distributor_user_id'];
	$dis_id = $_POST['distributor_id'];
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

	$select_order = mysqli_query($con, "select * from `tbl_sequence` where distributor_id='$dis_id'");
	if (mysqli_num_rows($select_order) > 0) {
		$select_row =  mysqli_fetch_assoc($select_order);
		$response['debit_note_sequence'] = $select_row['debit_note_sequence'];
	} else {
		$response['debit_note_sequence'] = '';
	}

	$select_product = mysqli_query($con, "SELECT * FROM tbl_purchase_party where distributor_id='$dis_id' and status='Active'");
	if (mysqli_num_rows($select_product) > 0) {
		$product = array();
		while ($fetch_product = mysqli_fetch_array($select_product)) {
			$product['party_id'] = $fetch_product['purchase_party_id'];
			$product['party_name'] = $fetch_product['party_name'];
			$product['party_phone'] = $fetch_product['party_phone'];
			$product['party_email'] = $fetch_product['party_email'];
			$product['gstin_no'] = $fetch_product['gstin_no'];
			$product['status'] = $fetch_product['status'];
			$product['party_address'] = $fetch_product['party_address'];
			$product['place_of_supply'] = $fetch_product['place_of_supply'];
			$product['outstanding_amount'] = $fetch_product['outstanding_amount'];
			$product['adjusted_outstanding_amt'] = $fetch_product['adjusted_outstanding_amt'];

			$party_place_id = $fetch_product['purchase_party_id'];
			$actual_amt = 0;
			$qry_debit_note_amount = mysqli_query($con, "select return_net_amt,adjust_amount,history_id from tbl_purchase_return_transaction where distributor_id='$dis_id' and debit_note_status='Pending' and party_id='$party_place_id'");
			while ($fetch_amt = mysqli_fetch_assoc($qry_debit_note_amount)) {
				$txn_id = $fetch_amt['history_id'];
				$purchase_credit_amt = $fetch_amt['return_net_amt'] - $fetch_amt['adjust_amount'];
				if ($purchase_credit_amt == 0)
					$uq1 = mysqli_query($con, "UPDATE tbl_purchase_return_transaction SET debit_note_status='Complete' where party_id='$party_place_id' and distributor_id='$dis_id' and history_id='$txn_id'");
				$actual_amt = $actual_amt + $purchase_credit_amt;
			}
			$res_qry1 = mysqli_query($con, "select final_net_amt,debitnote_id,adjust_amount from tbl_party_debit_note where distributor_id='$dis_id' and debit_note_status='Pending' and purchase_party_id='$party_place_id'");
			while ($fetch_res_qry1 = mysqli_fetch_assoc($res_qry1)) {
				$purchase_credit_amt = $fetch_res_qry1['final_net_amt'] - $fetch_res_qry1['adjust_amount'];
				$txn_id = $fetch_res_qry1['debitnote_id'];
				if ($purchase_credit_amt == 0)
					$uq1 = mysqli_query($con, "UPDATE tbl_party_debit_note SET debit_note_status='Complete' where purchase_party_id='$party_place_id' and distributor_id='$dis_id' and debitnote_id='$txn_id'");
				$actual_amt = $actual_amt + $purchase_credit_amt;
			}
			$product['adjustment_amount'] = $actual_amt;
			$response['parties'][] = $product;
			$response['success'] = '1';
			$response['details'] = "Purchase party fetched successfully";
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
