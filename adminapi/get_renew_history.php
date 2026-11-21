<?php
ob_start();
include("../../connect.php");
if(isset($_POST['distributor_id']))
{
	$dis_id = $_POST['distributor_id'];
	$final_flag=0;
	$product=array();
	$query1=mysqli_query($con,"SELECT * FROM `tbl_bt_transaction` where distributor_id='$dis_id'");
	if(mysqli_num_rows($query1)>0)
	{     
		$final_flag=1;
		while($row11=mysqli_fetch_assoc($query1))
		{
			$product['bt_txn_id'] = $row11['bt_txn_id'];
			$product['transaction_date'] = $row11['transaction_date'];
			$product['transaction_time'] = $row11['transaction_time'];
			$product['transaction_id'] = $row11['transaction_id'];
			$product['transaction_amount'] = $row11['transaction_amount'];
			$product['txn_status'] = $row11['txn_status'];
			$product['payment_mode'] = $row11['payment_mode'];
			$product['payment_transfer_id'] = $row11['payment_transfer_id'];
			$product['plan_type'] = $row11['plan_type'];
			$product['month'] = $row11['month'];
			$product['distributor_renew_date'] = $row11['distributor_renew_date'];
			$product['updated_renew_date'] = $row11['updated_renew_date'];
			$product['bank_name']='';
			$product['cheque_no']='';
			$product['cheque_date']='';
			if($row11['txn_status']=="Success")
				$product['invoice_recipt']="download_BTHAWK_receipt.php?id=".$row11['txn_id']."&user_id=".$dis_id;
			else
				$product['invoice_recipt']='';
			
			$response['product'][]=$product;
		}
	}
	$select_product=mysqli_query($con,"select * from tbl_cpartner_renew_transaction where distributor_id='$dis_id'");
	if(mysqli_num_rows($select_product)>0)
	{     
		$final_flag=1;
		while($fetch_product=mysqli_fetch_assoc($select_product))
		{
			$product['bt_txn_id']=$fetch_product['bt_txn_id'];
			$product['transaction_date']=$fetch_product['transaction_date'];
			$product['transaction_time']=$fetch_product['transaction_time'];
			$product['plan_type']=$fetch_product['plan_type'];
			$product['month']=$fetch_product['month'];
			$product['transaction_amount']=$fetch_product['transaction_amount'];
			$product['txn_status']=$fetch_product['txn_status'];
			$product['payment_mode']=$fetch_product['payment_mode'];
			$product['payment_transfer_id']=$fetch_product['payment_transfer_id'];
			$product['distributor_renew_date']=$fetch_product['distributor_renew_date'];
			$product['updated_renew_date']=$fetch_product['updated_renew_date'];
			$product['bank_name']=$fetch_product['bank_name'];
			$product['cheque_no']=$fetch_product['cheque_no'];
			$product['cheque_date']=$fetch_product['cheque_date'];
			if($fetch_product['txn_status']=="Success")
				$product['invoice_recipt']="download_BTHAWK_receipt.php?id=".$fetch_product['txn_id']."&user_id=".$dis_id;
			else
				$product['invoice_recipt']='';
			$response['product'][]=$product;
		}
	}
	if($final_flag==1)
	{
		$response['success']=1;	
		$response['details']="Data Success";
	}
	else
	{
		$response['success']='0';
		$response['message']="No Data Available!!";
	}
}
else
{
	$response['success']=0;
	$response['details']="Required fields missing";
}
echo json_encode($response);
?> 