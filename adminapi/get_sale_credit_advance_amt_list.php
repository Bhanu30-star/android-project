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
	
	
	$res_query = mysqli_query($con,"SELECT SUM(final_amt) as final_amt FROM `tbl_party_transaction` WHERE payment_status not in ('Converted') and transaction_to='$pidval' and transaction_date>='$f_start_date' and transaction_date<='$f_end_date' and transaction_from in (select user_id from tbl_user where `distributor_id` = '$session_dist_ver')");
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
	
	$partyselect=mysqli_query($con, "select party_phone,party_name from tbl_party where distributor_id='$session_dist_ver' and status='Active' and party_id='$pidval'");
	$fetch_party=mysqli_fetch_array($partyselect);
	$p_phone=$fetch_party['party_phone'];
	$p_name=$fetch_party['party_name'];
	$res = mysqli_query($con,"select  * ,tbl_party_transaction.transaction_id as t_id from tbl_party_transaction,tbl_user,tbl_party where tbl_party_transaction.transaction_from=tbl_user.user_id and tbl_party_transaction.transaction_to=tbl_party.party_id and tbl_user.distributor_id='$session_dist_ver' and tbl_party_transaction.payment_mode='Credit' and tbl_party_transaction.payment_status!='Complete' and tbl_party.party_phone='$p_phone' order by tbl_party_transaction.id DESC");
	$billbook_credit=array();
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			extract($fetch_product);
			$res123=mysqli_query($con,"Select SUM(total_amount) as total,receipt_id from tbl_receipt_transaction where transaction_id='$t_id'");
			$rows1=mysqli_fetch_assoc($res123);
			if($rows1['total']!='')
			{
				$bill_receive_amt=$rows1['total'];
			} else { $bill_receive_amt=0; }
			
			$billbook_credit['transaction_bill_number']=$transaction_bill_number;
			$billbook_credit['user_name']=$user_name;
			$billbook_credit['party_detail']=$party_name ." - " . $party_phone;
			$billbook_credit['transaction_date']=$transaction_date;
			$billbook_credit['transaction_time']=$transaction_time;
			$billbook_credit['payment_mode']=$payment_mode;
			$billbook_credit['final_amt']=$final_amt;
			$billbook_credit['receive_amount']=$bill_receive_amt;
			$billbook_credit['pending_amount']=$final_amt-$bill_receive_amt;
			$credit_amt_val=$credit_amt_val+round($final_amt-$bill_receive_amt);
			$response['billbook_credit'][]=$billbook_credit;
		}
	}else{
			$response['billbook_credit']=$billbook_credit;
	}
	
	
	
	$res2 = mysqli_query($con,"select * from tbl_other_receipt_txn where party_id in (select party_id from tbl_party where `distributor_id` = '$session_dist_ver' and party_phone='$p_phone') and adjustment_status='Pending' and receipt_type='Advance'");
							
	$res1 = mysqli_query($con,"select *,sum(final_net_amt) as final_bill_amt,sum(adjust_amount) as final_adjust_amt from tbl_party_credit_note where distributor_id='$session_dist_ver' and credit_note_status='Pending' and party_id in (select party_id from tbl_party where `distributor_id` = '$session_dist_ver' and party_phone='$p_phone') group by bill_no,unique_bill");
	
	$billbook_advance=array();
	if(mysqli_num_rows($res2)>0)
	{     
		while($fetch_product1=mysqli_fetch_assoc($res2))
		{
			extract($fetch_product1);
			$advance_amt_val=$advance_amt_val+round($total_amount-$adjust_amount);
			$billbook_advance['user_receipt_id']=$user_receipt_id;
			$billbook_advance['receipt_date']=date("d-M-Y", strtotime($receipt_date))." ".$receipt_time;;
			$billbook_advance['party_name']=$p_name.'-'.$p_phone;
			$billbook_advance['total_amount']=round($total_amount);
			$billbook_advance['adjust_amount']=round($adjust_amount);
			$billbook_advance['pending_amt']=round($total_amount-$adjust_amount);
			if($total_amount-$adjust_amount>0)
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
			extract($fetch_product2);
			$advance_amt_val=$advance_amt_val+round($final_bill_amt-$final_adjust_amt);
			$billbook_advance['user_receipt_id']=$bill_no;
			$billbook_advance['receipt_date']=date("d-M-Y", strtotime($bill_date))." ".$bill_time;;
			$billbook_advance['party_name']=$p_name.'-'.$p_phone;
			$billbook_advance['total_amount']=round($final_bill_amt);
			$billbook_advance['adjust_amount']=round($final_adjust_amt);
			$billbook_advance['pending_amt']=round($final_bill_amt-$final_adjust_amt);
			if($final_bill_amt-$final_adjust_amt>0)
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