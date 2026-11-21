<?php
include("../../connect.php");
$response = array();
if(isset($_POST['rec_id']) && isset($_POST['distributor_id']))
{
	$dis_user_id=$_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$dis_user_id'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("h:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$get_txn_id1=$_POST['rec_id'];
	$dist_dsr_require=$_POST['dsr_requirement'];
	$cash_amt=0;
	$cashmaster_affect='';
	$res = mysqli_query($con,"select * from tbl_receipt_transaction where receipt_id='$get_txn_id1'");
	while($fetch_product=mysqli_fetch_assoc($res))
	{
		extract($fetch_product);
		$cash_amt=$cash_amount;
		$final_txn_id=$transaction_id;
		$pmode=$fetch_product['payment_mode'];
		$txn13=$fetch_product['cheque_amount'];
		$deposit_bank_id=$bank_id;
		$txn_date=$receipt_date;
		$final_amount=$fetch_product['total_amount']+$fetch_product['receipt_disc_amt'];
		$cashmaster_affect=$cash_master_affect;
		$final_receipt_source=$source;
		if($final_receipt_source=='App')
			$tuser_id=$generated_user_id;
		$stock_insert=mysqli_query($con,"INSERT IGNORE INTO tbl_receipt_cancel_history(receipt_id,txn_receipt_id,transaction_id, receipt_date,receipt_time,total_amount,payment_mode,cash_amount,cheque_amount,cheque_no,bank_name,cheque_date,cash_receipt,status,remark,cancel_datetime,action_by,bank_id,receipt_disc_amt,`generated_user_id`)values('$receipt_id','$txn_receipt_id','$transaction_id','$receipt_date','$receipt_time','$total_amount','$payment_mode','$cash_amount','$cheque_amount','$cheque_no','$bank_name','$cheque_date','$cash_receipt','$status','$remark','$scri','$dis_user_id','$deposit_bank_id','$receipt_disc_amt','$generated_user_id')");
	}
	if($stock_insert)
	{
		$res_party = mysqli_query($con,"select cash_amount,transaction_to from tbl_party_transaction where transaction_id='$final_txn_id'");
		while($party_txn_detail=mysqli_fetch_assoc($res_party))
		{
			$final_cash_amt=$party_txn_detail['cash_amount'];
			$pp_id1=$party_txn_detail['transaction_to'];
			$set_amount=$final_cash_amt-$final_amount;
			if($set_amount==0)
			{
				$set_pstatus='Pending';
				$set_receipt_date="0000-00-00";
			}
			else
			{
				$set_pstatus='Partial Completed';
				$res_receipt = mysqli_query($con,"select receipt_date from tbl_receipt_transaction where transaction_id='$final_txn_id' order by receipt_id desc limit 1,2");
				while($receipt_txn_detail=mysqli_fetch_assoc($res_receipt))
				{
					$set_receipt_date=$receipt_txn_detail['receipt_date'];
				}
			}
			$uq21=mysqli_query($con,"update tbl_party_transaction set cash_amount='$set_amount',payment_status='$set_pstatus',cash_receipt_date='$set_receipt_date' where transaction_id='$final_txn_id'"); 
		}
		if($uq21)
		{
			$resd1 = mysqli_query($con,"DELETE FROM tbl_receipt_transaction where receipt_id='$get_txn_id1'");
		}
		
		$res_dsr = mysqli_query($con,"select * from tbl_dsr where user_id='$tuser_id' and date='$da' and dsr_status in ('Pending','Accept') and type!='System Generated Entry'");
		if(mysqli_num_rows($res_dsr)>0 || $txn_date==$da && $dist_dsr_require=='Yes' && $txn48=='App')
		{
			$uq1=mysqli_query($con,"UPDATE tbl_dsr SET dsr_status='Reject',accept_reject_datetime='$scri',update_by='$dis_user_id' where user_id='$tuser_id' and date='$da' and dsr_status in ('Pending','Accept')");
		}
		else
		{
			if(($final_receipt_source=="Web" || $final_receipt_source=="Admin") && $dist_dsr_require=='Yes')
			{
				include("cash_bank_effect_class.php");
				if($pmode=='Cash')
				{
					$CashCollection=new Collection();
					$collections=$CashCollection->purchasecashcollection($dis_user_id,$cash_amt,$txn_date);
				}
				else if($pmode=='Online' || $pmode=='Wallet')
				{
					$CashCollection=new Collection();
					$collections=$CashCollection->purchasebankcollection($dis_user_id,$deposit_bank_id,$txn13,$txn_date);
				}
				else if($pmode=='Both' && $cash_amt>0)
				{
					$CashCollection=new Collection();
					$collections=$CashCollection->purchasecashcollection($dis_user_id,$cash_amt,$txn_date);
				}
			}
			else if($final_receipt_source=='App' && ($cash_amt>0 || $txn13>0) && $dist_dsr_require=='Yes' && $txn_date!=$da)
			{
				$res_dsr_entry = mysqli_query($con,"INSERT IGNORE INTO tbl_dsr(user_id,cash_detail,cheque_detail,total_amount,date, time,tb_insertdate, tb_inserttime,type,dsr_status)values('$tuser_id','$cash_amt','$txn13','$cash_amt+$txn13','$txn_date','$scro','$txn_date','$scro','System Generated Entry','Accept')");
				if($cash_amt>0)
				{
					include("cash_bank_effect_class.php");
					if($pmode=='Cash')
					{
						$CashCollection=new Collection();
						$collections=$CashCollection->purchasecashcollection($dis_user_id,$cash_amt,$txn_date);
					}
					else if($pmode=='Online')
					{
						$CashCollection=new Collection();
						$collections=$CashCollection->purchasebankcollection($dis_user_id,$deposit_bank_id,$txn13,$txn_date);
					}
					else if($pmode=='Both' && $cash_amt>0)
					{
						$CashCollection=new Collection();
						$collections=$CashCollection->purchasecashcollection($dis_user_id,$cash_amt,$txn_date);
					}
				}
			}
		}
		
		include("sale-purchase-balance-effect-class.php");
		$CashCollection=new Collectionbalance();
		$collections=$CashCollection->salecollection($dis_user_id,$final_amount,$txn_date,$pp_id1);
		
	}
	if($resd1)
	{
		$response['success']='1';
		$response['details']="Receipt Successfully Cancelled";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);


?>