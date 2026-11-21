<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['distributor_user_id']))
{
	$session_dist_ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$dis_user_id = $_POST['distributor_user_id'];
	
	$clear_purparty_update = mysqli_query($con,"update `tbl_purchase_party` set adjusted_outstanding_amt='0' where distributor_id='$session_dist_ver'");

	$clear_party_update = mysqli_query($con,"update `tbl_party` set adjusted_outstanding_amt='0' where distributor_id='$session_dist_ver'");
	
	$clear_bank_update = mysqli_query($con,"update `tbl_distributor_bank_master` set opening_balance='0' where distributor_id='$session_dist_ver'");
	
	$clear_disc = mysqli_query($con,"delete FROM `tbl_party_discount_detail` where distributor_id='$session_dist_ver'");
	
	$retva56 = mysqli_query($con,"DELETE FROM tbl_distributor_bank_collection where distributor_id='$session_dist_ver'");
	
	$retva55 = mysqli_query($con,"DELETE FROM tbl_distributor_cash_collection where distributor_id='$session_dist_ver'");

	$res_pur_charges = mysqli_query($con,"DELETE FROM tbl_distributor_transaction_charges WHERE distributor_id='$session_dist_ver'");

	$res_pur_charges_history = mysqli_query($con,"DELETE FROM tbl_distributor_transaction_charges_history WHERE distributor_id='$session_dist_ver'");

	$res_autorefill_delete = mysqli_query($con,"DELETE FROM tbl_autofill_retailer_message_detail where distributor_id='$session_dist_ver'");

	$res_view_delete = mysqli_query($con,"DELETE FROM vwSalesSummary where distributor_id='$session_dist_ver'");

	$retval1 = mysqli_query($con,"DELETE FROM tbl_user_request_detail WHERE transaction_id in (select transaction_id from tbl_user_request,tbl_user where tbl_user_request.user_id=tbl_user.user_id and tbl_user.distributor_id='$session_dist_ver')");

	$retval2 = mysqli_query($con,"DELETE FROM tbl_user_request WHERE user_id in (select user_id from tbl_user where distributor_id='$session_dist_ver')");

	$retval3 = mysqli_query($con,"DELETE FROM tbl_user_request_detail_txn WHERE transaction_id in (select transaction_id from tbl_user_request_txn,tbl_user where tbl_user_request_txn.user_id=tbl_user.user_id and tbl_user.distributor_id='$session_dist_ver')");

	$retval4 = mysqli_query($con,"DELETE FROM tbl_user_request_txn WHERE user_id in (select user_id from tbl_user where distributor_id='$session_dist_ver')");

	$retval5 = mysqli_query($con,"DELETE FROM tbl_user_stock WHERE user_id in (select user_id from tbl_user where distributor_id='$session_dist_ver')");

	$retval6 = mysqli_query($con,"DELETE tbl_message_read_detail FROM tbl_user_message,tbl_message_read_detail WHERE tbl_user_message.message_id=tbl_message_read_detail.message_id and  tbl_user_message.distributor_id='$session_dist_ver'");

	$retval7 = mysqli_query($con,"DELETE FROM tbl_sequence WHERE distributor_id='$session_dist_ver'");

	$retval8 = mysqli_query($con,"DELETE FROM tbl_party_product WHERE distributor_id='$session_dist_ver'");

	$retval9 = mysqli_query($con,"DELETE FROM tbl_party_product_history WHERE distributor_id='$session_dist_ver'");

	$retval10 = mysqli_query($con,"DELETE tbl_dsr_rejected FROM tbl_dsr_rejected,tbl_user WHERE tbl_dsr_rejected.user_id = tbl_user.user_id and tbl_user.distributor_id='$session_dist_ver'");

	$retval2 = mysqli_query($con,"DELETE FROM tbl_distributor_stock WHERE distributor_id='$session_dist_ver'");

	$retval3 = mysqli_query($con,"DELETE FROM tbl_distributor_transaction WHERE distributor_id='$session_dist_ver'");

	$retval4 = mysqli_query($con,"DELETE FROM tbl_distributor_business_control WHERE distributor_id='$session_dist_ver'");

	$retval11 = mysqli_query($con,"DELETE FROM tbl_bill_cancel_detail WHERE transaction_id in (select transaction_id from tbl_bill_cancel,tbl_user where tbl_bill_cancel.transaction_from=tbl_user.user_id and tbl_user.distributor_id='$session_dist_ver')");

	$retval5 = mysqli_query($con,"DELETE FROM tbl_bill_cancel WHERE transaction_from in (select user_id from tbl_user where distributor_id='$session_dist_ver')");

	$retval16 = mysqli_query($con,"DELETE FROM tbl_dsr_cashDetail WHERE dsr_id in (select dsr_id from tbl_dsr,tbl_user where tbl_dsr.user_id=tbl_user.user_id and tbl_user.distributor_id='$session_dist_ver')");

	$retval7 = mysqli_query($con,"DELETE FROM tbl_dsr WHERE user_id in (select user_id from tbl_user where distributor_id='$session_dist_ver')");

	$retval18 = mysqli_query($con,"DELETE FROM tbl_other_receipt_cheque_bounce WHERE receipt_txn_id in (select receipt_txn_id from tbl_other_receipt_txn,tbl_user where tbl_other_receipt_txn.user_id=tbl_user.user_id and tbl_user.distributor_id='$session_dist_ver')");

	$retval9 = mysqli_query($con,"DELETE FROM tbl_other_receipt_txn WHERE user_id in (select user_id from tbl_user where distributor_id='$session_dist_ver')");

	$retval33 = mysqli_query($con,"DELETE FROM tbl_other_receipt_cancel_history WHERE user_id in (select user_id from tbl_user where distributor_id='$session_dist_ver')");

	$uq1=mysqli_query($con,"update tbl_product set stock_quantity='0',discount_applicable='No',discount_percentage='0',discount_amount='0' where distributor_id='$session_dist_ver'");

	$retval20 = mysqli_query($con,"DELETE FROM tbl_receipt_cheque_bounce_history WHERE receipt_id in (select receipt_id from tbl_receipt_transaction,tbl_user,tbl_party_transaction where tbl_receipt_transaction.transaction_id = tbl_party_transaction.transaction_id and tbl_party_transaction.transaction_from=tbl_user.user_id and tbl_user.distributor_id='$session_dist_ver')");

	$retva21 = mysqli_query($con,"DELETE FROM tbl_receipt_transaction WHERE transaction_id in (select transaction_id from tbl_user,tbl_party_transaction where tbl_party_transaction.transaction_from=tbl_user.user_id and tbl_user.distributor_id='$session_dist_ver')");

	$retval22 = mysqli_query($con,"DELETE FROM tbl_cheque_bounce_history WHERE transaction_id in (select transaction_id from tbl_user,tbl_party_transaction where  tbl_party_transaction.transaction_from=tbl_user.user_id and tbl_user.distributor_id='$session_dist_ver')");

	$retva23 = mysqli_query($con,"DELETE FROM tbl_party_transaction_detail WHERE transaction_id in (select transaction_id from tbl_user,tbl_party_transaction where tbl_party_transaction.transaction_from=tbl_user.user_id and tbl_user.distributor_id='$session_dist_ver')");

	$retva24 = mysqli_query($con,"DELETE FROM tbl_party_transaction WHERE transaction_from in (select user_id from tbl_user where distributor_id='$session_dist_ver')");

	$retva34 = mysqli_query($con,"DELETE FROM tbl_party_settlement WHERE party_id in (select party_id from tbl_party,tbl_user where tbl_party.user_id=tbl_user.user_id and tbl_user.distributor_id='$session_dist_ver')");

	$retva25 = mysqli_query($con,"DELETE FROM tbl_product_serialno_fos_return WHERE user_id  user_id in (select user_id from tbl_user where distributor_id='$session_dist_ver')");

	$retva26 = mysqli_query($con,"DELETE FROM tbl_product_serialno WHERE product_id in (select product_id from tbl_product where distributor_id='$session_dist_ver')");

	$retva27 = mysqli_query($con,"DELETE FROM tbl_product_serialno_history WHERE product_id in (select product_id from tbl_product where distributor_id='$session_dist_ver')");

	$retva28 = mysqli_query($con,"DELETE FROM tbl_purchase_cart WHERE product_id in (select product_id from tbl_product where distributor_id='$session_dist_ver')");

	$retva37 = mysqli_query($con,"DELETE FROM tbl_sale_cart WHERE product_id in (select product_id from tbl_product where distributor_id='$session_dist_ver')");

	$retva38 = mysqli_query($con,"DELETE FROM tbl_purchase_return_cart WHERE product_id in (select product_id from tbl_product where distributor_id='$session_dist_ver')");

	$retva35 = mysqli_query($con,"DELETE FROM tbl_retailer_sale_return WHERE party_id in (select party_id from tbl_party,tbl_user where tbl_party.user_id=tbl_user.user_id and tbl_user.distributor_id='$session_dist_ver')");

	$retva36 = mysqli_query($con,"DELETE FROM tbl_retailer_sale_return_detail WHERE product_id in (select product_id from tbl_product where distributor_id='$session_dist_ver')");

	$retva39 = mysqli_query($con,"DELETE FROM tbl_retailer_message_detail where user_id in (select user_id from tbl_user where distributor_id='$session_dist_ver')");

	$retva41 = mysqli_query($con,"DELETE FROM tbl_user_message where distributor_id='$session_dist_ver'");

	$retva42 = mysqli_query($con,"DELETE FROM tbl_purchase_return_transaction where distributor_id='$session_dist_ver'");

	$retva43 = mysqli_query($con,"DELETE FROM tbl_purchase_payment_transaction where distributor_id='$session_dist_ver'");

	$retva44 = mysqli_query($con,"DELETE FROM tbl_purchase_bill_cancel where distributor_id='$session_dist_ver'");

	$retva45 = mysqli_query($con,"DELETE FROM tbl_purchase_cancel_serialno where distributor_id='$session_dist_ver'");

	$retva46 = mysqli_query($con,"DELETE FROM tbl_party_debit_note_deatil where unique_bill in (select unique_bill from tbl_party_debit_note where  distributor_id='$session_dist_ver')");

	$retva47 = mysqli_query($con,"DELETE FROM tbl_party_debit_note where distributor_id='$session_dist_ver'");

	$retva48 = mysqli_query($con,"DELETE FROM tbl_party_credit_note_deatil where unique_bill in (select unique_bill from tbl_party_debit_note where  distributor_id='$session_dist_ver')");

	$retva49 = mysqli_query($con,"DELETE FROM tbl_party_credit_note where distributor_id='$session_dist_ver'");

	$retva50 = mysqli_query($con,"DELETE FROM tbl_debitnote_adjustment_cancel where distributor_id='$session_dist_ver'");

	$retva51 = mysqli_query($con,"DELETE FROM tbl_debit_note_adjustment where distributor_id='$session_dist_ver'");

	$retva52 = mysqli_query($con,"DELETE FROM tbl_purchase_return_serialno where product_id in (select product_id from tbl_product where distributor_id='$session_dist_ver')");

	$retva53 = mysqli_query($con,"DELETE FROM tbl_distributor_bank_transfer where distributor_id='$session_dist_ver'");
	$retva54 = mysqli_query($con,"DELETE FROM tbl_distributor_expenses_master where distributor_id='$session_dist_ver'");

	$sale_summry=mysqli_query($con,"DELETE FROM `tblSalesSummary` WHERE distributor_id='$session_dist_ver'");

	$credit_sale=mysqli_query($con,"DELETE FROM `tblCreditSaleSummary` WHERE distributor_id='$session_dist_ver'");

	$ret_consume = mysqli_query($con,"DELETE FROM tbl_party_transaction_consumable_detail WHERE product_id in (select product_id from tbl_product where distributor_id='$session_dist_ver')");

	$ret_consume_delete = mysqli_query($con,"DELETE FROM tbl_bill_cancel_consumable_detail WHERE product_id in (select product_id from tbl_product where distributor_id='$session_dist_ver')");


	$cdate  = date("Y-m-d")." ".date('H:i:sa');

	$query11 = mysqli_query($con,"insert into tbl_distributor_clear_control(distributor_id,clear_datetime,action_by)values('$session_dist_ver','$cdate','$dis_user_id')");
	$action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$session_dist_ver', 'UPDATE+DELETE OPERATION,Business Txn Clear Confirmation#Admin(UPDATE)tbl_purchase_party,tbl_party,tbl_distributor_bank_master#(DELETE)tbl_party_discount_detail,tbl_distributor_cash_collection,tbl_distributor_bank_collection,tbl_distributor_transaction_charges,tbl_distributor_transaction_charges_history,etc', current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')");													
	$response['success']='1';
	$response['message']="Business Transaction Successfully Cleared!!";
}
else
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);

?>