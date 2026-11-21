<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']) )
{
	$session_dist_ver = $_POST['distributor_id'];	
	$res_data = mysqli_query($con,"select *  from tbl_party_eway where status='Pending' and json_data!='' and distributor_id='$session_dist_ver'");
	$bill_error_detail=array();
	if(mysqli_num_rows($res_data)>0)
	{     
		while($fetch_product2=mysqli_fetch_assoc($res_data))
		{
			$bill_error_detail['document_type']=$fetch_product2['document_type'];
			$bill_error_detail['document_no']=$fetch_product2['document_no'];
			$bill_error_detail['document_date']=$fetch_product2['document_date'];
			$bill_error_detail['buyer_detail']=$fetch_product2['buyer_trade'].' - '.$fetch_product2['buyer_phone'];
			$bill_error_detail['doc_item_amount']=$fetch_product2['total_inv_vaue'];
			$bill_error_detail['status']=$fetch_product2['status'];
			$bill_error_detail['json_data']=$fetch_product2['json_data'];
			$bill_error_detail['transaction_id']=$fetch_product2['transaction_id'];
			$response['bill_error_detail'][]=$bill_error_detail;
		}
	}
	else
	{
		$response['bill_error_detail']=$bill_error_detail;
	}
	
	$res_data_2 = mysqli_query($con,"select *  from tbl_party_eway where status='Cancelled' and distributor_id='$session_dist_ver'");
	$bill_delete_detail=array();
	if(mysqli_num_rows($res_data_2)>0)
	{     
		while($fetch_product2=mysqli_fetch_assoc($res_data_2))
		{
			$bill_delete_detail['document_type']=$fetch_product2['document_type'];
			$bill_delete_detail['document_no']=$fetch_product2['document_no'];
			$bill_delete_detail['document_date']=$fetch_product2['document_date'];
			$bill_delete_detail['buyer_detail']=$fetch_product2['buyer_trade'].' - '.$fetch_product2['buyer_phone'];
			$bill_delete_detail['doc_item_amount']=$fetch_product2['total_inv_vaue'];
			$bill_delete_detail['status']=$fetch_product2['status'];
			$bill_delete_detail['json_data']=$fetch_product2['json_data'];
			$bill_delete_detail['ewayBillNo']=$fetch_product2['ewayBillNo'];
			$response['bill_delete_detail'][]=$bill_delete_detail;
		}
	}
	else
	{
		$response['bill_delete_detail']=$bill_delete_detail;
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