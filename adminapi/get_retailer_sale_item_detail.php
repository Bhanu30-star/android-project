<?php
include("../../connect.php");
$response = array();
if(isset($_POST['transaction_id']))
{
	$txn_id=$_POST['transaction_id'];
	$billbook_detail=array();
	$res_test_product = mysqli_query($con,"select * from  tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id=tbl_product.product_id and tbl_party_transaction_detail.transaction_id='$txn_id' order by tbl_party_transaction_detail.transaction_detail_id asc");    
	while($fetch_product=mysqli_fetch_assoc($res_test_product))
	{
				
		$billbook_detail['transaction_detail_id']=$fetch_product['transaction_detail_id'];
		$billbook_detail['product_id']=$fetch_product['product_id'];
		$billbook_detail['product_name']=$fetch_product['product_name'];
		$billbook_detail['product_price']=$fetch_product['product_price'];
		$billbook_detail['quantity']=$fetch_product['quantity'];
		$billbook_detail['product_disc']=$fetch_product['product_disc'];
		$billbook_detail['IMEI_NO']=$fetch_product['IMEI_NO'];	
		$billbook_detail['CGST_amount']=$fetch_product['CGST_amount'];
		$billbook_detail['SGST_amount']=$fetch_product['SGST_amount'];
		$billbook_detail['IGST_amount']=$fetch_product['IGST_amount'];	
		$billbook_detail['gst_perc']=$fetch_product['gst_perc'];
		$response['billbook_detail'][]=$billbook_detail;
	}
	$response['success']='1';
	$response['message']="Fetch Detail Successful";
}		
else
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);

?>