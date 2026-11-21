<?php
$response = array();
include("../../connect.php");
if(isset($_POST['key_uid']) && isset($_POST['txn_id']) && isset($_POST['payment_status']) && isset($_POST['distributor_id']) && isset($_POST['amount']))
{  
	$check_pending_amt=0;
	$client1 = $_POST['key_uid'];
	$txn_id = $_POST['txn_id'];   
	$dis_id = $_POST['distributor_id'];	
	$amount = $_POST['amount'];	
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$dis_id'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("H:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$sign_image = isset($_FILES['sign_image']['name']) ? $_FILES['sign_image']['name'] : '';
	if($sign_image!="")
	{
		$destination = "../retailer_bill_signature/";
		$photoname=basename($_FILES['sign_image']['tmp_name']).'.jpg';
		move_uploaded_file($_FILES['sign_image']['tmp_name'], $destination.''.$photoname);	
	}
	$pmode = $_POST['payment_mode'];   
	$pstatus = $_POST['payment_status'];
	$bank_name=$_POST['bank_name'];
	$cheque_no=$_POST['cheque_no'];
	$cheque_date=$_POST['cheque_date'];
	$remark=$_POST['remark'];
	if($pmode=="Both")
	{
		$cash_amt=$_POST['cash_amount'];
		$cheque_amt=$_POST['cheque_amount'];
	}
	else if($pmode=="Cash")
	{
		$cash_amt=$amount;
		$cheque_amt=0;
	}
	else
	{
		$cash_amt=0;
		$cheque_amt=$amount;
	}
	$temp_explode="";
	$select_order=mysqli_query($con,"select receipt_sequence from `tbl_sequence` where distributor_id='$dis_id'");
	$select_row =  mysqli_fetch_assoc($select_order);
	if(mysqli_num_rows($select_order)>0)
	{
		$temp=$select_row['receipt_sequence'];
		if($temp=="")
		{
			$sd="R00001";
		}
		else
		{
			$final_invoice=(int)substr($temp,1);
			$final_invoice=$final_invoice+1;
			$final_invoice1=(string)$final_invoice;
			$string_count=5-(int)strlen($final_invoice1);
			for($vb=0;$vb<$string_count;$vb++)
			{
				$temp_explode=$temp_explode."0";
			}
			$sd="R".$temp_explode.$final_invoice;
		}
		$uq_sequence=mysqli_query($con,"UPDATE tbl_sequence SET receipt_sequence='$sd',last_update_datetime='$scri' where distributor_id='$dis_id'");
	}
	else
	{
		$sd="R00001";
		$uq_sequence =mysqli_query($con,"insert into tbl_sequence(distributor_id,receipt_sequence,last_update_datetime)values('$dis_id','$sd','$scri')");
	}	
	
	
	$select_product=mysqli_query($con,"SELECT final_amt,cash_amount FROM tbl_party_transaction where transaction_from='$client1' and payment_status!='Complete' and payment_mode='Credit' and transaction_id='$txn_id'");
    while($fetch_product=mysqli_fetch_array($select_product))
	{
		$check_pending_amt=ceil($fetch_product['final_amt']-$fetch_product['cash_amount']);
	}
	if($check_pending_amt>=$amount)
	{
		$query1=mysqli_query($con,"insert into tbl_receipt_transaction(txn_receipt_id,transaction_id,receipt_date,receipt_time,total_amount,status,payment_mode,cash_amount,	cheque_amount,cheque_no,bank_name,cheque_date,remark,sign_image)values ('$sd','$txn_id','$da','$scro','$amount','Complete','$pmode','$cash_amt','$cheque_amt','$cheque_no','$bank_name','$cheque_date','$remark','$photoname')");
	
		$select_txn=mysqli_query($con,"select cash_amount from `tbl_party_transaction` where transaction_id='$txn_id' and payment_status!='Complete'");
		$select_row_txn =  mysqli_fetch_assoc($select_txn);
		if(mysqli_num_rows($select_txn)>0)
		{
			$fetch_amount=$select_row_txn['cash_amount'];
			$party_uid=$select_row_txn['transaction_to'];
			$final_amt=$fetch_amount+$amount;
			$uq=mysqli_query($con,"UPDATE tbl_party_transaction SET cash_amount='$final_amt',payment_status='$pstatus',cash_receipt_date='$da' where transaction_id ='$txn_id' and transaction_from='$client1'");
			
			include("sale-purchase-balance-effect-class.php");
			$CashCollection=new Collectionbalance();
			$collections=$CashCollection->saleminuscollection($dis_id,$amount,$da,$party_uid);
			
			
			$response['inVoiceReceipt']=$sd;
			$response['success']=1;
			$response['details']="Receipt Submitted";
		}
		// $action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$session_dist_ver', 'INSERT+UPDATE OPERATION,Distributor cash receipt#Admin(INSERT)tbl_receipt_transaction#(INSERT+UPDATE)tbl_party_transaction,tbl_sequence,', current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')");			
	}
	else
	{
		$response['success']=0;
		$response['details']="Duplicate receipt txn";
	}
	
}
else
{
	$response['success']=0;
	$response['details']="Required Field Missing...!!";
}		
echo json_encode($response);
?> 