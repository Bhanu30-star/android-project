<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['transaction_id']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$eway_txn=$_POST['transaction_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("H:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$query1=mysqli_query($con,"select * from tbl_party_eway where transaction_id='$eway_txn' and distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($query1)==1)
	{     

		while($fetch_product=mysqli_fetch_assoc($query1))
		{
			extract($fetch_product);
			$res=mysqli_query($con,"INSERT INTO `tbl_party_eway_history` ( `transaction_id`, `distributor_id`, `invoice_id`, `supplyType`, `subSupplyType`, `subSupplyDesc`, `document_type`, `document_no`, `document_date`, `seller_gstin`, `seller_trade`, `seller_address1`, `seller_address2`, `seller_place`, `seller_pin`, `seller_statecode`, `buyer_gstin`, `buyer_trade`, `buyer_address1`, `buyer_address2`, `buyer_place`, `buyer_pin`, `buyer_statecode`, `transactionType`, `dispatch_fromGSTIN`, `dispatch_fromTrade`, `ship_toGSTIN`, `ship_toTrade`, `doc_total_value`, `doc_cgst_amt`, `doc_sgst_amt`, `doc_igst_amt`, `doc_cess_amt`, `doc_nonadvol_amt`, `doc_other_charges`, `total_inv_vaue`, `transporter_id`, `transporterName`, `transDocNo`, `transMode`, `transDistance`, `transDocDate`, `vehicleNo`, `vehicleType`, `status`, `AuthToken`, `ewayBillNo`, `ewayBillDate`, `cancelDate`, `validUpto`, `alert`, `lrn`, `AckNo`, `json_data`, `delete_json_data`, `insert_date`, `insert_time`, `delete_date`, `delete_time`,`update_date`, `update_time`, `insert_from_data`) VALUES ( '$transaction_id', '$distributor_id', '$invoice_id', '$supplyType', '$subSupplyType', '$subSupplyDesc', '$document_type', '$document_no', '$document_date', '$seller_gstin', '$seller_trade', '$seller_address1', '$seller_address2', '$seller_place', '$seller_pin','$seller_statecode', '$buyer_gstin', '$buyer_trade', '$buyer_address1', '$buyer_address2', '$buyer_place', '$buyer_pin', '$buyer_statecode', '$transactionType', '$dispatch_fromGSTIN', '$dispatch_fromTrade', '$ship_toGSTIN', '$ship_toTrade', '$doc_total_value', '$doc_cgst_amt', '$doc_sgst_amt', '$doc_igst_amt', '$doc_cess_amt', '$doc_nonadvol_amt', '$doc_other_charges', '$total_inv_vaue', '$transporter_id', '$transporterName', '$transDocNo', '$transMode', '$transDistance', '$transDocDate', '$vehicleNo', 'vehicleType', '$status', '$AuthToken', '$ewayBillNo', '$ewayBillDate', '$cancelDate', '$validUpto', '$alert', '$lrn', '$AckNo', '$json_data', '$delete_json_data', '$insert_date', '$insert_time', '$delete_date', '$delete_time','$da', '$scro', '$insert_from_data')");
			$dist_updt=mysqli_query($con,"UPDATE tbl_party_eway SET json_data='',status='Pending' WHERE distributor_id='$session_dist_ver' and transaction_id='$eway_txn'");
		}
	
		$response['success']='1';
		$response['details']="Transaction Detail Successfully Deleted for E-Way...!!";
	}
	else
	{
		$response['success']='0';
		$response['details']="Transaction Not Deleted.!!";
	}
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>