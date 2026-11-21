<?php
include("../../connect.php");
$response = array();
if(isset($_POST['searchdate1']) && isset($_POST['searchdate2']) && isset($_POST['distributor_id']) && isset($_POST['distributor_user_id']))
{
	$session_dist_ver=$_POST['distributor_id'];
	$cdate1=$_POST['searchdate1'];
	$cdate2=$_POST['searchdate2'];
	$dis_uid = $_POST['distributor_user_id'];

	$select_user=mysqli_query($con,"SELECT imei_no,session_id FROM tbl_distributor_users where status='Active' and distributor_user_id='$dis_uid'");
	if(mysqli_num_rows($select_user)>0)
	{     
		while($fetch_user=mysqli_fetch_array($select_user))
		{
			$response['user_status']='1';
			$response['user_imei']=$fetch_user['imei_no'];
			$response['session_id']=$fetch_user['session_id'];
		}
	}
	else
	{	
		$response['user_status']='0';
		$response['session_id']='';
		$response['user_imei']='';
	}
	$check_author1=mysqli_query($con,"select doctorapp_type from tbl_distributor where distributor_id='$session_dist_ver'");
	$fetch_product_check=mysqli_fetch_assoc($check_author1);
	$doctorapp_type=$fetch_product_check['doctorapp_type'];
	$res = mysqli_query($con,"select * from tbl_bill_cancel,tbl_user,tbl_party where tbl_bill_cancel.transaction_from=tbl_user.user_id and  tbl_bill_cancel.transaction_to=tbl_party.party_id and  tbl_bill_cancel.transaction_date>='$cdate1' and tbl_bill_cancel.transaction_date<='$cdate2' and tbl_user.distributor_id='$session_dist_ver' order by tbl_bill_cancel.transaction_id DESC");
	$billbook=array();
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			extract($fetch_product);
			$billbook['transaction_id']=$fetch_product['transaction_id'];
			$billbook['invoice_number']=$fetch_product['transaction_bill_number'];
			$billbook['transaction_date']=$fetch_product['transaction_date'];
			$billbook['transaction_time']=$fetch_product['transaction_time'];
			$billbook['party_name']=$fetch_product['party_name'];
			$billbook['party_phone']=$fetch_product['party_phone'];
			$billbook['fos_name']=$fetch_product['user_name'];
			$billbook['total_amount']=$fetch_product['total_amount'];
			$billbook['discount_amount']=$fetch_product['disc_amt'];
			$billbook['final_amount']=$fetch_product['final_amt'];
			$billbook['payment_mode']=$fetch_product['payment_mode'];
			$billbook['bill_type']=$fetch_product['bill_type'];
			$billbook['source']=$fetch_product['source'];
			$billbook['gst_configure']=$fetch_product['gst_configure'];
			$res_test_product = mysqli_query($con,"select * from  tbl_bill_cancel_detail,tbl_product where tbl_bill_cancel_detail.product_id=tbl_product.product_id and tbl_bill_cancel_detail.transaction_id='$transaction_id' order by tbl_bill_cancel_detail.transaction_detail_id asc limit 1");    
			while($fetch_test_product=mysqli_fetch_assoc($res_test_product))
			{
				$check_product_type=$fetch_test_product['product_type'];
			}
			if($bill_type=="Receipt") {
				$billbook['invoice_receipt']="download_cancel_receipt_invoice.php?id=".$transaction_id."&lng=eng&userid=".$session_dist_ver;
			} else if($fetch_product['barcode_bill']=='Yes') {
				$billbook['invoice_receipt']="download_barcode_invoice_receipt_cancel.php?id=".$transaction_id."&lng=eng&userid=".$session_dist_ver;
			} else if($txn_service_type=="Retail") {
				$billbook['invoice_receipt']="download_barcode_invoice_receipt_cancel.php?id=".$transaction_id."&lng=eng&userid=".$session_dist_ver;
			} else if($check_product_type=="FMCG") {	if($doctorapp_type=="Yes") {
				$billbook['invoice_receipt']="download-cess-cancel-receipt-medical.php?id=".$transaction_id."&lng=eng&userid=".$session_dist_ver;
			} else {
				$billbook['invoice_receipt']="download-cess-cancel-receipt.php?id=".$transaction_id."&lng=eng&userid=".$session_dist_ver;
			}} else if($serial_no_bill=="Yes") {
				$billbook['invoice_receipt']="download_cancel_serialno_receipt.php?id=".$transaction_id."&lng=eng&userid=".$session_dist_ver;
			} else {	
				$billbook['invoice_receipt']="download_cancel_receipt.php?id=".$transaction_id."&lng=eng&userid=".$session_dist_ver;
			}
			$response['billbook'][]=$billbook;
		}
	}
	else
	{
		$response['billbook']=$billbook;
	}
	$res_purchase = mysqli_query($con,"select * from tbl_purchase_bill_cancel,tbl_purchase_party,tbl_product where tbl_purchase_bill_cancel.party_id = tbl_purchase_party.purchase_party_id and tbl_purchase_bill_cancel.product_id=tbl_product.product_id and tbl_purchase_bill_cancel.distributor_id = '$session_dist_ver' and tbl_purchase_bill_cancel.transaction_date>='$cdate1' and tbl_purchase_bill_cancel.transaction_date<='$cdate2' and tbl_product.product_type!='Payout' and tbl_purchase_bill_cancel.action_type='' order by tbl_purchase_bill_cancel.transaction_id ASC");
	$product=array();
	if(mysqli_num_rows($res_purchase)>0)
	{ 
		while($fetch_product=mysqli_fetch_assoc($res_purchase))
		{
			$product['bill_no']=$fetch_product['bill_no'];
			$product['bill_date']=$fetch_product['bill_date'];
			$product['bill_time']=$fetch_product['bill_time'];
			$product['party_name']=$fetch_product['party_name'];
			$product['product_name']=$fetch_product['product_name'];
			$product['quantity']=$fetch_product['quantity'];
			$product['cgst_amt']= $fetch_product['cgst_amt'];
			$product['sgst_amt']= $fetch_product['sgst_amt'];
			$product['igst_amt']= $fetch_product['igst_amt'];
			$product['cess_amt']= $fetch_product['cess_amt'];
			$product['total_amount']= $fetch_product['total_amount'];
			$product['discount_amt']= $fetch_product['discount_amt'];
			$product['final_net_amt']= $fetch_product['final_net_amt'];
			$response['product'][]=$product;
		}
	}
	else
	{
		$response['product']=$product;
	}
	$response['success']='1';
	$response['details']="Fetch Detail Successful";
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>