<?php
include("../../connect.php");
$response = array();
if(isset($_POST['party_id']) && isset($_POST['distributor_id']) && isset($_POST['receipt_txn_id']))
{
	$dis_user_id = $_POST['distributor_user_id'];
	$session_dist_ver = $_POST['distributor_id'];
	$partyid=$_POST['party_id'];
	$get_txn_id1=$_POST['receipt_txn_id'];
	$actual_dsr_requirement=$_POST['dsr_requirement'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$da  = date("Y-m-d")." ".date('H:i:sa');
	$cdate=date("Y-m-d");
	$scri=date('H:i:sa');
	$res = mysqli_query($con,"select * from tbl_receipt_transaction where receipt_id='$get_txn_id1' and party_id='$partyid'");
	if(mysqli_num_rows($res)>0)
	{
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			extract($fetch_product);
			$cash_amt=$cash_amount;
			$txn13=$fetch_product['cheque_amount'];
			$pmode=$fetch_product['payment_mode'];
			$actual_add_paid=$total_amount+$receipt_disc_amt;
			$deposit_bank_id=$bank_id;
			$cashmaster_affect=$cash_master_affect;
			$txn_date=$receipt_date;
			$stock_insert=mysqli_query($con,"INSERT IGNORE INTO tbl_receipt_cancel_history(receipt_id,txn_receipt_id,transaction_id, receipt_date,receipt_time,total_amount,payment_mode,cash_amount,cheque_amount,cheque_no,bank_name,cheque_date,cash_receipt,status, remark,cancel_datetime,action_by,party_id,bank_id,receipt_disc_amt,`generated_user_id`)values('$receipt_id','$txn_receipt_id','$transaction_id','$txn_date','$receipt_time','$total_amount','$payment_mode','$cash_amt','$txn13','$cheque_no','$bank_name','$cheque_date','$cash_receipt','$status','$remark','$scri','$dis_user_id','$partyid','$deposit_bank_id','$receipt_disc_amt','$generated_user_id')");
				
			$uq1=mysqli_query($con,"UPDATE tbl_party SET adjusted_outstanding_amt=round(adjusted_outstanding_amt-'$actual_add_paid',2) where distributor_id='$session_dist_ver' and party_id='$partyid'");
			if($uq1)
			{
				$res_update = mysqli_query($con,"delete FROM tbl_receipt_transaction where party_id='$partyid' and receipt_id='$get_txn_id1'");
				
				include("sale-purchase-balance-effect-class.php");
				$CashCollection=new Collectionbalance();
				$collections=$CashCollection->salecollection($session_dist_ver,$actual_add_paid,$txn_date,$partyid);
				
				if($actual_dsr_requirement=="Yes")
				{
					include("cash_bank_effect_class.php");
					if($pmode=='Cash')
					{
						$CashCollection=new Collection();
						$collections=$CashCollection->purchasecashcollection($session_dist_ver,$cash_amt,$cdate);
					}
					else if($pmode=='Online')
					{
						$CashCollection=new Collection();
						$collections=$CashCollection->purchasebankcollection($session_dist_ver,$deposit_bank_id,$txn13,$cdate);
					}
					else if($pmode=='Both' && $cash_amt>0)
					{
						$CashCollection=new Collection();
						$collections=$CashCollection->purchasecashcollection($session_dist_ver,$cash_amt,$cdate);
					}
				}
				$response['success']='1';
				$response['details']="Receipt Delete Successfully";
			}
			else
			{
				$response['success']='0';
				$response['details']="Receipt Can't Deleted. please try again later!!";
			}
		}
	}
	else
	{
		$response['success']='0';
		$response['details']="Receipt Detail Not Correct. please try again later!!";
	}
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>