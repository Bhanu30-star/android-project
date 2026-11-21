<?php
include("../../connect.php");
$response = array();
if(isset($_POST['party_id']) && isset($_POST['distributor_id']))
{
	$pidval=$_POST['party_id'];
	$session_dist_ver=$_POST['distributor_id'];
	$credit_amt_val=0;
	$advance_amt_val=0;
	
	$temp_date_v=date("m");
	if($temp_date_v > 03){
		$syeardate = date("Y");
		$syeardate_next = $syeardate+1;
	}
	else{
		$syeardates = date("Y");
		$syeardate = $syeardates-1;
		$syeardate_next = $syeardates;
	}
	$f_start_date=$syeardate.'-04-01';
	$f_end_date=$syeardate_next.'-03-31';
	
	$res_query = mysqli_query($con,"SELECT SUM(final_net_amt) as final_amt FROM `tbl_distributor_transaction` WHERE party_id='$pidval' and distributor_id = '$session_dist_ver' and txn_type='Add' and bill_date>='$f_start_date' and bill_date<='$f_end_date'");
	if(mysqli_num_rows($res_query)>0)
	{     
		while($fetch_turnover=mysqli_fetch_assoc($res_query))
		{
			$response['retailer_pan_turnover']=$fetch_turnover['final_amt'];
		}
	}
	else
	{
		$response['retailer_pan_turnover']='0';
	}
	
	
	
	$res = mysqli_query($con,"SELECT sum(tbl_distributor_transaction.final_net_amt) as bill_final_amt, sum(tbl_distributor_transaction.pay_amount) as paid_amt, tbl_purchase_party.party_name, tbl_purchase_party.purchase_party_id, tbl_distributor_transaction.bill_no,tbl_distributor_transaction.bill_date,tbl_distributor_transaction.transaction_date,tbl_purchase_party.party_phone,tbl_distributor_transaction.unique_bill FROM tbl_distributor_transaction,tbl_purchase_party,tbl_product where tbl_distributor_transaction.product_id=tbl_product.product_id and tbl_distributor_transaction.party_id = tbl_purchase_party.purchase_party_id and  tbl_distributor_transaction.payment_status!='Complete' and tbl_distributor_transaction.payment_mode='Credit' and tbl_purchase_party.distributor_id='$session_dist_ver' and tbl_distributor_transaction.party_id='$pidval' group by tbl_distributor_transaction.unique_bill,bill_no");
	$billbook_credit=array();
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			$billbook_credit['bill_no']=$fetch_product['bill_no'];
			$billbook_credit['bill_date']=$fetch_product['bill_date'];
			$billbook_credit['transaction_date']=$fetch_product['transaction_date'];
			$billbook_credit['party_name']=$fetch_product['party_name'];
			$billbook_credit['party_phone']=$fetch_product['party_phone'];
			$billbook_credit['bill_final_amt']=$fetch_product['bill_final_amt'];
			$billbook_credit['paid_amt']=$fetch_product['paid_amt'];
			$billbook_credit['pending_amount']=$fetch_product['bill_final_amt']-$fetch_product['paid_amt'];
			$credit_amt_val=$credit_amt_val+round($fetch_product['bill_final_amt']-$fetch_product['paid_amt']);
			$response['billbook_credit'][]=$billbook_credit;
		}
	}else{
			$response['billbook_credit']=$billbook_credit;
	}
	
	
	$res2 = mysqli_query($con,"select *,sum(tbl_purchase_return_transaction.return_net_amt) as final_bill_amt, sum(tbl_purchase_return_transaction.adjust_amount) as final_adjust_amt from tbl_purchase_return_transaction,tbl_purchase_party where tbl_purchase_return_transaction.party_id=tbl_purchase_party.purchase_party_id and tbl_purchase_return_transaction.distributor_id='$session_dist_ver' and tbl_purchase_return_transaction.party_id='$pidval' and tbl_purchase_return_transaction.debit_note='Yes' and tbl_purchase_return_transaction.debit_note_status='Pending' group by tbl_purchase_return_transaction.debit_note_receipt");
						
	$res1 = mysqli_query($con,"select *,sum(tbl_party_debit_note.final_net_amt) as final_bill_amt, sum(tbl_party_debit_note.adjust_amount) as final_adjust_amt from tbl_party_debit_note,tbl_purchase_party where tbl_party_debit_note.purchase_party_id=tbl_purchase_party.purchase_party_id and tbl_party_debit_note.distributor_id='$session_dist_ver' and tbl_party_debit_note.purchase_party_id='$pidval' and tbl_party_debit_note.debit_note_status='Pending' group by tbl_party_debit_note.bill_no,unique_bill");
	$billbook_advance=array();
	if(mysqli_num_rows($res2)>0)
	{     
		while($fetch_product1=mysqli_fetch_assoc($res2))
		{
			$advance_amt_val=$advance_amt_val+round($fetch_product1['final_bill_amt']-$fetch_product1['final_adjust_amt']);
			if($debit_note_receipt!='')
				$billbook_advance['debit_note_no']=$fetch_product1['debit_note_receipt'];
			else 
				$billbook_advance['debit_note_no']='Purchase Return';
			$billbook_advance['transaction_date']=$fetch_product1['transaction_date'];
			$billbook_advance['party_name']=$fetch_product1['party_name']."-".$fetch_product1['party_phone'];
			$billbook_advance['bill_no']=$fetch_product1['bill_no'];
			$billbook_advance['bill_date']=$fetch_product1['bill_date'].' '.$fetch_product1['bill_time'];
			$billbook_advance['final_bill_amt']=$fetch_product1['final_bill_amt'];
			$billbook_advance['final_adjust_amt']=$fetch_product1['final_adjust_amt'];
			$billbook_advance['pending_amount']=$fetch_product1['final_bill_amt']-$fetch_product1['final_adjust_amt'];
			if($fetch_product1['final_bill_amt']-$fetch_product1['final_adjust_amt']>0)
				$billbook_advance['status']='Pending';
			else
				$billbook_advance['status']='Complete';
			$response['billbook_advance'][]=$billbook_advance;
		}
	}

	if(mysqli_num_rows($res1)>0)
	{     
		while($fetch_product2=mysqli_fetch_assoc($res1))
		{
			$advance_amt_val=$advance_amt_val+round($fetch_product2['final_bill_amt']-$fetch_product2['final_adjust_amt']);
			$billbook_advance['debit_note_no']=$fetch_product2['bill_no'];
			$billbook_advance['transaction_date']=$fetch_product2['transaction_date'];
			$billbook_advance['party_name']=$fetch_product2['party_name']."-".$fetch_product2['party_phone'];
			$billbook_advance['bill_no']=$fetch_product2['bill_no'];
			$billbook_advance['bill_date']=$fetch_product2['bill_date'].' '.$fetch_product2['bill_time'];
			$billbook_advance['final_bill_amt']=$fetch_product2['final_bill_amt'];
			$billbook_advance['final_adjust_amt']=$fetch_product2['final_adjust_amt'];
			$billbook_advance['pending_amount']=$fetch_product2['final_bill_amt']-$fetch_product2['final_adjust_amt'];
			if($fetch_product2['final_bill_amt']-$fetch_product2['final_adjust_amt']>0)
				$billbook_advance['status']='Pending';
			else
				$billbook_advance['status']='Complete';
			$response['billbook_advance'][]=$billbook_advance;
		}
	}
	
	if(mysqli_num_rows($res1)==0 && mysqli_num_rows($res2)==0)
	{
		$response['billbook_advance']=$billbook_advance;
	}
	
	$response['credit_amount']=$credit_amt_val;
	$response['advance_amount']=$advance_amt_val;
	$response['success']='1';
	$response['message']="Fetch Detail Successful";
	
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>