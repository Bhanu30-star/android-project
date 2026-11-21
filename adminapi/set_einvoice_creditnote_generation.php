<?php
include("../../connect.php");
$response = array();
if(isset($_POST['transaction_id']) &&  isset($_POST['distributor_id']))
{
	$bill_invoice_id=$_POST['transaction_id'];
	$session_dist_ver = $_POST['distributor_id'];
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
	$msg_insert_check=0;
	$select_note=mysqli_query($con,"select * from `tbl_party_einvoice` where invoice_id='$bill_invoice_id' and distributor_id='$session_dist_ver' and document_type='CRN'");
	if(mysqli_num_rows($select_note)>0)
	{
		$msg_insert_check=1;
	}
	if($msg_insert_check==0)
	{
		$select_message=mysqli_query($con,"select * from `tbl_party_einvoice` where transaction_id='$bill_invoice_id' and distributor_id='$session_dist_ver'");
		while($check_txn=mysqli_fetch_assoc($select_message))
		{
			$res = mysqli_query($con,"INSERT INTO `tbl_party_einvoice`(`distributor_id`, `invoice_id`, `version`, `taxsch`, `transaction_category`, `reverse_charges`, `ecommerce_gstin`, `igst_intra`, `document_type`, `document_no`, `document_date`, `seller_gstin`, `seller_legal_name`, `seller_trade`, `seller_phone`, `seller_location`, `seller_pin`, `seller_statecode`, `seller_email`, `seller_address1`, `seller_address2`, `buyer_gstin`, `buyer_legalname`, `buyer_trade`, `buyer_pin`, `buyer_place_supply`, `buyer_location`, `buyer_statecode`, `buyer_phone`, `buyer_address1`, `buyer_address2`, `doc_assess_amount`, `doc_item_amount`, `doc_cgst_amt`, `doc_sgst_amt`, `doc_igst_amt`, `doc_cess_amt`, `doc_discount_amt`, `status`, `insert_date`, `insert_time`) VALUES ('$session_dist_ver','$bill_invoice_id','".$check_txn['version']."','".$check_txn['taxsch']."','".$check_txn['transaction_category']."','".$check_txn['reverse_charges']."','".$check_txn['ecommerce_gstin']."','".$check_txn['igst_intra']."','CRN','".$check_txn['document_no']."','".$check_txn['document_date']."','".$check_txn['seller_gstin']."','".$check_txn['seller_legal_name']."','".$check_txn['seller_trade']."','".$check_txn['seller_phone']."','".$check_txn['seller_location']."','".$check_txn['seller_pin']."','".$check_txn['seller_statecode']."','".$check_txn['seller_email']."','".$check_txn['seller_address1']."','".$check_txn['seller_address2']."','".$check_txn['buyer_gstin']."','".$check_txn['buyer_legalname']."','".$check_txn['buyer_trade']."','".$check_txn['buyer_pin']."','".$check_txn['buyer_place_supply']."','".$check_txn['buyer_location']."','".$check_txn['buyer_statecode']."','".$check_txn['buyer_phone']."','".$check_txn['buyer_address1']."','".$check_txn['buyer_address2']."','".$check_txn['doc_assess_amount']."','".$check_txn['doc_item_amount']."','".$check_txn['doc_cgst_amt']."','".$check_txn['doc_sgst_amt']."','".$check_txn['doc_igst_amt']."','".$check_txn['doc_cess_amt']."','".$check_txn['doc_discount_amt']."','Pending','$da','$scro')");
			$re = mysqli_insert_id($con);
			if($re>0)
			{
				$res1 = mysqli_query($con,"select * from tbl_party_einvoice_detail where transaction_id='$bill_invoice_id'");
				while($fetch_product3=mysqli_fetch_assoc($res1))
				{
					$query2=mysqli_query($con,"INSERT INTO `tbl_party_einvoice_detail`(`transaction_id`, `product_id`, `product_name`, `hsn_code`, `product_price`, `quantity`, `product_disc`, `CGST_amount`, `SGST_amount`, `IGST_amount`, `gst_perc`, `product_total_amt`, `assess_amount`,`net_amount`,`IMEI_NO`, `cess_percentage`,`cess_final_amt`) VALUES ('$re','".$fetch_product3['product_id']."','".$fetch_product3['product_name']."','".$fetch_product3['hsn_code']."','".$fetch_product3['product_price']."','".$fetch_product3['quantity']."','".$fetch_product3['product_disc']."','".$fetch_product3['CGST_amount']."','".$fetch_product3['SGST_amount']."','".$fetch_product3['IGST_amount']."','".$fetch_product3['gst_perc']."','".$fetch_product3['product_total_amt']."','".$fetch_product3['assess_amount']."','".$fetch_product3['net_amount']."','".$fetch_product3['IMEI_NO']."','".$fetch_product3['cess_percentage']."','".$fetch_product3['cess_final_amt']."')");
				}
				$response['success']='1';
				$response['details']="E-Invoice Credit-Note Successfully Inserted...!!";
			}
			else
			{
				$response['success']='0';
				$response['details']="Insertion Error...!!";
			}
		}
	}
	else
	{
		$response['success']='0';
		$response['details']="E-Invoice Credit-Note Already Generated...!!";
	}
}	
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>