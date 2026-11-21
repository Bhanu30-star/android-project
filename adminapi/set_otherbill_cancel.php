<?php
include("../../connect.php");
$response = array();
if(isset($_POST['rec_id']) && isset($_POST['distributor_id']))
{
	$session_dist_ver=$_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("h:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$dis_user_id=$_POST['distributor_user_id'];
	$get_txn_id1=$_POST['rec_id'];
	$check_author = mysqli_query($con,"select dsr_requirement from tbl_distributor where distributor_id='$session_dist_ver'");
	while($row_data = mysqli_fetch_array($check_author))
	{
		$actual_dsr_requirement=$row_data['dsr_requirement'];
	}
	$res = mysqli_query($con,"select * from tbl_other_receipt_txn where receipt_txn_id='$get_txn_id1' and adjust_amount='0'");
	if(mysqli_num_rows($res)>0)
	{
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			extract($fetch_product);
			$final_amt=$fetch_product['total_amount'];
			$pp_id1=$fetch_product['party_id'];
			$cdate=$fetch_product['receipt_date'];
			$paymode=$fetch_product['payment_mode'];
			$cashamt=$fetch_product['cash_amount'];
			$cheqamt=$fetch_product['cheque_amount'];
			
			$stock_insert=mysqli_query($con,"insert into tbl_other_receipt_cancel_history(receipt_txn_id,user_receipt_id,user_id, party_id,receipt_date,receipt_time,payment_mode,total_amount,receipt_type,cash_amount,cheque_amount,cheque_no,bank_name,cheque_date,cash_receipt,status,remark,cancel_datetime,action_by,bank_id)values('$receipt_txn_id','$user_receipt_id','$user_id','$party_id','$receipt_date','$receipt_time','$payment_mode','$total_amount','$receipt_type','$cash_amount','$cheque_amount','$cheque_no','$bank_name','$cheque_date','$cash_receipt','$status','$remark','$scri','$dis_user_id','$bank_id')");
		}
		if($stock_insert)
		{
			$resd1 = mysqli_query($con,"DELETE FROM tbl_other_receipt_txn where receipt_txn_id='$get_txn_id1'");
			
			include("sale-purchase-balance-effect-class.php");
			$CashCollection=new Collectionbalance();
			$collections=$CashCollection->salecollection($session_dist_ver,$final_amt,$cdate,$pp_id1);
			
			if($actual_dsr_requirement=="Yes")
			{
				include("cash_bank_effect_class.php");
				if($paymode=='Cash')
				{
					$CashCollection=new Collection();
					$collections=$CashCollection->purchasecashcollection($session_dist_ver,$cashamt,$cdate);
				}
				else if($paymode=='Online' || $pmode=='Wallet')
				{
					$CashCollection=new Collection();
					$collections=$CashCollection->purchasebankcollection($session_dist_ver,$bank_id,$cheqamt,$cdate);
				}
				if($paymode=='Both' && $cashamt>0)
				{
					$CashCollection=new Collection();
					$collections=$CashCollection->purchasecashcollection($session_dist_ver,$cashamt,$cdate);
				}
			}
			$response['success']='1';
			$response['details']="Receipt Successfully Cancelled";
		}
	}
	else
	{
		$response['success']='0';
		$response['details']="Not Allowed to Cancelled the receipt";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);


?>